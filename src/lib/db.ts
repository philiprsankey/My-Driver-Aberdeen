import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const globalForDb = globalThis as unknown as {
  sql?: NeonQueryFunction<false, false>;
  schemaReady?: Promise<void>;
};

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT,
    subscription_status TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    pickup TEXT NOT NULL,
    destination TEXT NOT NULL,
    journey_date TEXT NOT NULL,
    journey_time TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS bookings_user_created ON bookings (user_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS pending_signups (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    sent_at TEXT NOT NULL
  )`,
];

export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || "";
}

function connectionString() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

function sqlClient() {
  globalForDb.sql ??= neon(connectionString());
  return globalForDb.sql;
}

async function migrate() {
  const sql = sqlClient();
  for (const statement of statements) {
    await sql.query(statement);
  }
  const columns = (await sql.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'`,
  )) as Array<{ column_name: string }>;
  const names = new Set(columns.map((column) => column.column_name));
  for (const name of ["stripe_customer_id", "stripe_subscription_id", "plan", "subscription_status"]) {
    if (!names.has(name)) await sql.query(`ALTER TABLE users ADD COLUMN ${name} TEXT`);
  }
}

async function ready() {
  globalForDb.schemaReady ??= migrate().catch((error: unknown) => {
    globalForDb.schemaReady = undefined;
    throw error;
  });
  await globalForDb.schemaReady;
}

export async function dbAll<T>(text: string, params: unknown[] = []) {
  await ready();
  return (await sqlClient().query(text, params)) as T[];
}

export async function dbOne<T>(text: string, params: unknown[] = []) {
  const rows = await dbAll<T>(text, params);
  return rows[0];
}

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
