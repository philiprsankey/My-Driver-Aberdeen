import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const globalForDb = globalThis as unknown as { membersDb?: DatabaseSync };

function createDatabase() {
  const directory = path.join(process.cwd(), "data");
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(path.join(directory, "members.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      plan TEXT,
      subscription_status TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pickup TEXT NOT NULL,
      destination TEXT NOT NULL,
      journey_date TEXT NOT NULL,
      journey_time TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS bookings_user_created ON bookings (user_id, created_at);
    CREATE TABLE IF NOT EXISTS pending_signups (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      sent_at TEXT NOT NULL
    );
  `);
  return db;
}

function ensureMembershipColumns(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const names = new Set(columns.map((column) => column.name));
  for (const name of ["stripe_customer_id", "stripe_subscription_id", "plan", "subscription_status"]) {
    if (!names.has(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} TEXT`);
  }
}

function ensureBookingsTable(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pickup TEXT NOT NULL,
      destination TEXT NOT NULL,
      journey_date TEXT NOT NULL,
      journey_time TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS bookings_user_created ON bookings (user_id, created_at);
  `);
}

export function getDb() {
  globalForDb.membersDb ??= createDatabase();
  ensureMembershipColumns(globalForDb.membersDb);
  ensureBookingsTable(globalForDb.membersDb);
  return globalForDb.membersDb;
}
