import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const globalForDb = globalThis as unknown as {
  sql?: NeonQueryFunction<false, false>;
  schemaReadyV3?: Promise<void>;
};

const statements = [
  `CREATE TABLE IF NOT EXISTS account_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    working_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
    stripe_customer_id TEXT,
    membership_checkout_id TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE account_users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
  `ALTER TABLE account_users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`,
  `ALTER TABLE account_users ADD COLUMN IF NOT EXISTS subscription_status TEXT`,
  `CREATE TABLE IF NOT EXISTS account_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES account_users(id),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS pending_signups (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS operational_settings (
    id INTEGER PRIMARY KEY,
    minimum_notice_hours INTEGER,
    payment_hold_minutes INTEGER NOT NULL DEFAULT 60,
    working_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
    priority_hours JSONB NOT NULL DEFAULT '[]'::jsonb
  )`,
  `INSERT INTO operational_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
  `CREATE TABLE IF NOT EXISTS hire_allowances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES account_users(id),
    subscription_id TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    granted INTEGER NOT NULL DEFAULT 5,
    plan TEXT
  )`,
  `ALTER TABLE hire_allowances ADD COLUMN IF NOT EXISTS plan TEXT`,
  `CREATE INDEX IF NOT EXISTS hire_allowances_user_idx ON hire_allowances (user_id)`,
  `CREATE TABLE IF NOT EXISTS journey_bookings (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES account_users(id),
    driver_id TEXT REFERENCES account_users(id),
    group_id TEXT,
    pickup TEXT NOT NULL,
    destination TEXT NOT NULL,
    pickup_at TIMESTAMPTZ NOT NULL,
    phone TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    fare_destination TEXT,
    status TEXT NOT NULL DEFAULT 'requested',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    amount_pence INTEGER,
    duration_minutes INTEGER,
    buffer_minutes INTEGER NOT NULL DEFAULT 0,
    use_membership BOOLEAN NOT NULL DEFAULT FALSE,
    priority BOOLEAN NOT NULL DEFAULT FALSE,
    allowance_id TEXT REFERENCES hire_allowances(id),
    consumes_hire BOOLEAN NOT NULL DEFAULT FALSE,
    hold_until TIMESTAMPTZ,
    approval_version INTEGER NOT NULL DEFAULT 0,
    checkout_id TEXT,
    payment_intent_id TEXT,
    refund_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS journey_bookings_customer_idx ON journey_bookings (customer_id)`,
  `CREATE INDEX IF NOT EXISTS journey_bookings_driver_time_idx ON journey_bookings (driver_id, pickup_at)`,
  `CREATE TABLE IF NOT EXISTS driver_blocks (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES account_users(id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    label TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS account_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES account_users(id),
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || "";
}

function sqlClient() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not set");
  globalForDb.sql ??= neon(url);
  return globalForDb.sql;
}

async function ready() {
  globalForDb.schemaReadyV3 ??= (async () => {
    const sql = sqlClient();
    for (const statement of statements) {
      await sql.query(statement);
    }
  })().catch((error: unknown) => {
    globalForDb.schemaReadyV3 = undefined;
    throw error;
  });
  await globalForDb.schemaReadyV3;
}

export async function dbAll<T>(text: string, params: unknown[] = []) {
  await ready();
  return (await sqlClient().query(text, params)) as T[];
}

export async function dbOne<T>(text: string, params: unknown[] = []) {
  const rows = await dbAll<T>(text, params);
  return rows[0];
}

export async function dbTransaction(queries: { text: string; params?: unknown[] }[]) {
  await ready();
  const sql = sqlClient();
  return sql.transaction((txn) => queries.map((query) => txn.query(query.text, query.params ?? [])));
}

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
