import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { normaliseEmail } from "@/lib/account-validation";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";

const cookieName = "mda_session";
const rememberedEmailCookie = "mda_email";
const sessionDays = 30;

export type Member = {
  id: string;
  name: string;
  email: string;
  plan: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
};

type UserRow = Member & { password_hash: string };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiresAt() {
  return new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
}

export async function createMember(input: { name: string; email: string; password: string }) {
  const passwordHash = await hashPassword(input.password);
  return createMemberWithHash({ name: input.name, email: input.email, passwordHash });
}

export async function createMemberWithHash(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const db = getDb();
  const id = randomUUID();
  try {
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(id, input.name, normaliseEmail(input.email), input.passwordHash, new Date().toISOString());
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { ok: false as const, error: "An account with that email already exists." };
    }
    throw error;
  }
  await startSession(id);
  return { ok: true as const, id };
}

export async function signInMember(email: string, password: string) {
  const db = getDb();
  const user = db
    .prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?")
    .get(normaliseEmail(email)) as UserRow | undefined;
  const passwordHash = user?.password_hash ?? `${"0".repeat(32)}:${"0".repeat(128)}`;
  const matches = await verifyPassword(password, passwordHash);
  if (!user || !matches) {
    return { ok: false as const, error: "Email or password is not correct." };
  }
  await startSession(user.id);
  return { ok: true as const, id: user.id };
}

export async function getCurrentMember(): Promise<Member | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  const member = db
    .prepare(
      `SELECT users.id AS id, users.name AS name, users.email AS email,
              users.plan AS plan, users.subscription_status AS subscriptionStatus,
              users.stripe_customer_id AS stripeCustomerId
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(hashToken(token), now) as Member | undefined;
  return member ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }
  jar.delete(cookieName);
}

export async function rememberedEmail() {
  return (await cookies()).get(rememberedEmailCookie)?.value ?? "";
}

async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = expiresAt();
  const db = getDb();
  db.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)").run(
    randomUUID(),
    userId,
    hashToken(token),
    expires.toISOString(),
  );
  const account = db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as { email: string } | undefined;
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
