import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createMemberWithHash } from "@/lib/auth";
import { normaliseEmail } from "@/lib/account-validation";
import { getDb } from "@/lib/db";
import { sendVerificationCode } from "@/lib/mail";
import { hashPassword } from "@/lib/passwords";

const cookieName = "mda_verify";
const codeMinutes = 10;
const cookieMinutes = 30;
const resendWaitMs = 60_000;
const maxAttempts = 5;

type PendingRow = {
  email: string;
  name: string;
  password_hash: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  sent_at: string;
};

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function codesMatch(code: string, storedHash: string) {
  const actual = createHash("sha256").update(code).digest();
  const expected = Buffer.from(storedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function makeCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function readPending(email: string) {
  return getDb()
    .prepare(
      `SELECT email, name, password_hash, code_hash, expires_at, attempts, sent_at
       FROM pending_signups WHERE email = ?`,
    )
    .get(email) as PendingRow | undefined;
}

function savePending(row: Omit<PendingRow, "attempts"> & { attempts?: number }) {
  getDb()
    .prepare(
      `INSERT INTO pending_signups (email, name, password_hash, code_hash, expires_at, attempts, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         name = excluded.name,
         password_hash = excluded.password_hash,
         code_hash = excluded.code_hash,
         expires_at = excluded.expires_at,
         attempts = excluded.attempts,
         sent_at = excluded.sent_at`,
    )
    .run(
      row.email,
      row.name,
      row.password_hash,
      row.code_hash,
      row.expires_at,
      row.attempts ?? 0,
      row.sent_at,
    );
}

async function rememberEmail(email: string) {
  (await cookies()).set(cookieName, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieMinutes * 60,
  });
}

export async function pendingSignupEmail() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;
  const email = normaliseEmail(value);
  return readPending(email) ? email : null;
}

export async function beginEmailVerification(input: { name: string; email: string; password: string }) {
  const email = normaliseEmail(input.email);
  const db = getDb();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM pending_signups WHERE sent_at <= ?").run(dayAgo);

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
  if (existing) {
    return { ok: false as const, error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(input.password);
  const current = readPending(email);
  const sentRecently = current !== undefined && Date.now() - Date.parse(current.sent_at) < resendWaitMs;
  if (current && sentRecently) {
    savePending({ ...current, name: input.name, password_hash: passwordHash });
    await rememberEmail(email);
    return { ok: true as const };
  }

  const code = makeCode();
  const now = new Date();
  const next = {
    email,
    name: input.name,
    password_hash: passwordHash,
    code_hash: hashCode(code),
    expires_at: new Date(now.getTime() + codeMinutes * 60 * 1000).toISOString(),
    attempts: 0,
    sent_at: now.toISOString(),
  };
  savePending(next);
  const sent = await sendVerificationCode(email, code);
  if (!sent.ok) {
    if (current) savePending(current);
    else db.prepare("DELETE FROM pending_signups WHERE email = ?").run(email);
    return sent;
  }

  await rememberEmail(email);
  return { ok: true as const };
}

export async function resendVerificationCode() {
  const email = await pendingSignupEmail();
  if (!email) return { ok: false as const, error: "Start again from create an account." };
  const current = readPending(email);
  if (!current) return { ok: false as const, error: "Start again from create an account." };
  if (Date.now() - Date.parse(current.sent_at) < resendWaitMs) {
    return { ok: false as const, error: "Please wait a minute before sending another code." };
  }

  const code = makeCode();
  const now = new Date();
  savePending({
    ...current,
    code_hash: hashCode(code),
    expires_at: new Date(now.getTime() + codeMinutes * 60 * 1000).toISOString(),
    attempts: 0,
    sent_at: now.toISOString(),
  });
  const sent = await sendVerificationCode(email, code);
  if (!sent.ok) {
    savePending(current);
    return sent;
  }
  return { ok: true as const };
}

export async function confirmVerificationCode(rawCode: string) {
  const digits = rawCode.replace(/\D/g, "");
  if (digits.length !== 6) {
    return { ok: false as const, error: "Enter the 6-digit code." };
  }

  const email = await pendingSignupEmail();
  if (!email) return { ok: false as const, error: "Start again from create an account." };
  const current = readPending(email);
  if (!current) return { ok: false as const, error: "Start again from create an account." };
  if (Date.parse(current.expires_at) <= Date.now()) {
    return { ok: false as const, error: "That code has expired. Send a new code." };
  }
  if (current.attempts >= maxAttempts) {
    return { ok: false as const, error: "Too many attempts. Send a new code." };
  }
  if (!codesMatch(digits, current.code_hash)) {
    getDb().prepare("UPDATE pending_signups SET attempts = attempts + 1 WHERE email = ?").run(email);
    return { ok: false as const, error: "That code is not correct." };
  }

  const created = await createMemberWithHash({
    name: current.name,
    email,
    passwordHash: current.password_hash,
  });
  if (!created.ok) return created;

  getDb().prepare("DELETE FROM pending_signups WHERE email = ?").run(email);
  (await cookies()).delete(cookieName);
  return { ok: true as const };
}
