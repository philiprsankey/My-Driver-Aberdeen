import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { normaliseEmail } from "@/lib/account-validation";
import { databaseUrl, dbOne, isUniqueViolation } from "@/lib/db";
import { verifyPassword } from "@/lib/passwords";

const cookieName = "mda_session";
const rememberedEmailCookie = "mda_email";
const sessionDays = 30;

export type Account = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UserRow = Account & { password_hash: string | null };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiresAt() {
  return new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
}

export async function ensureOwner() {
  await dbOne(
    `UPDATE account_users SET role = 'admin'
     WHERE id = (
       SELECT id FROM account_users
       WHERE NOT EXISTS (SELECT 1 FROM account_users WHERE role = 'admin')
       ORDER BY created_at ASC
       LIMIT 1
     )`,
  );
}

export async function createAccountWithHash(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const id = randomUUID();
  try {
    await ensureOwner();
    const admin = await dbOne("SELECT id FROM account_users WHERE role = 'admin' LIMIT 1");
    await dbOne(
      `INSERT INTO account_users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, input.name, normaliseEmail(input.email), input.passwordHash, admin ? "customer" : "admin"],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false as const, error: "An account with that email already exists." };
    }
    throw error;
  }
  await startSession(id);
  return { ok: true as const, id };
}

export async function signInAccount(email: string, password: string) {
  if (!databaseUrl()) {
    return { ok: false as const, error: "Accounts are not available just now." };
  }
  const user = await dbOne<UserRow>(
    "SELECT id, name, email, role, password_hash FROM account_users WHERE email = $1",
    [normaliseEmail(email)],
  );
  const passwordHash = user?.password_hash ?? `${"0".repeat(32)}:${"0".repeat(128)}`;
  const matches = await verifyPassword(password, passwordHash);
  if (!user || !matches) {
    return { ok: false as const, error: "Email or password is not correct." };
  }
  await startSession(user.id);
  return { ok: true as const, id: user.id };
}

export async function getCurrentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !databaseUrl()) return null;
  const now = new Date().toISOString();
  await dbOne("DELETE FROM account_sessions WHERE expires_at <= $1", [now]);
  const account = await dbOne<Account>(
    `SELECT account_users.id AS id, account_users.name AS name, account_users.email AS email,
            account_users.role AS role
     FROM account_sessions
     JOIN account_users ON account_users.id = account_sessions.user_id
     WHERE account_sessions.token_hash = $1 AND account_sessions.expires_at > $2`,
    [hashToken(token), now],
  );
  return account ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token && databaseUrl()) {
    await dbOne("DELETE FROM account_sessions WHERE token_hash = $1", [hashToken(token)]);
  }
  jar.delete(cookieName);
}

export async function rememberedEmail() {
  return (await cookies()).get(rememberedEmailCookie)?.value ?? "";
}

async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = expiresAt();
  await dbOne("INSERT INTO account_sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)", [
    randomUUID(),
    userId,
    hashToken(token),
    expires.toISOString(),
  ]);
  const account = await dbOne<{ email: string }>("SELECT email FROM account_users WHERE id = $1", [userId]);
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  if (account?.email) {
    jar.set(rememberedEmailCookie, account.email, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }
}
