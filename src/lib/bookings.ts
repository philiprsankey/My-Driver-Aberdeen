import { randomUUID } from "node:crypto";
import type { Member } from "@/lib/auth";
import { databaseUrl, dbAll, dbOne } from "@/lib/db";

const maxNote = 500;
const maxPlace = 120;

export type HireRequest = {
  id: string;
  pickup: string;
  destination: string;
  journeyDate: string;
  journeyTime: string;
  note: string;
  status: string;
  createdAt: string;
};

export function canRequestHire(status: string | null) {
  return status === "active" || status === "trialing";
}

export function londonToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatJourneyDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function cleanPlace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function latestBookableDate() {
  const today = londonToday();
  const [year, month, day] = today.split("-").map(Number);
  const next = new Date(Date.UTC(year + 1, month - 1, day));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function validateHire(input: {
  date: string;
  time: string;
  pickup: string;
  destination: string;
  note: string;
}) {
  const pickup = cleanPlace(input.pickup);
  const destination = cleanPlace(input.destination);
  const note = input.note.trim().replace(/\s+/g, " ");
  const date = input.date.trim();
  const time = input.time.trim();

  if (pickup.length < 2 || pickup.length > maxPlace) return { ok: false as const, error: "Enter the pickup address." };
  if (destination.length < 2 || destination.length > maxPlace) {
    return { ok: false as const, error: "Enter the destination." };
  }
  if (!validDate(date)) return { ok: false as const, error: "Choose a date." };
  if (date < londonToday()) return { ok: false as const, error: "Choose a date today or later." };
  if (date > latestBookableDate()) return { ok: false as const, error: "Choose a date within the next year." };
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return { ok: false as const, error: "Choose a time." };
  if (note.length > maxNote) return { ok: false as const, error: "The note is too long." };

  return { ok: true as const, value: { pickup, destination, note, date, time } };
}

export function listHires(userId: string) {
  return dbAll<HireRequest>(
    `SELECT id, pickup, destination, journey_date AS "journeyDate", journey_time AS "journeyTime",
            note, status, created_at AS "createdAt"
     FROM bookings WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
}

export async function createHireRequest(
  member: Member,
  input: { date: string; time: string; pickup: string; destination: string; note: string },
) {
  if (!canRequestHire(member.subscriptionStatus)) {
    return { ok: false as const, error: "An active membership is needed before a hire can be requested." };
  }
  if (!databaseUrl()) {
    return { ok: false as const, error: "Accounts are not available just now." };
  }
  const parsed = validateHire(input);
  if (!parsed.ok) return parsed;

  await dbOne(
    `INSERT INTO bookings (id, user_id, pickup, destination, journey_date, journey_time, note, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'requested', $8)`,
    [
      randomUUID(),
      member.id,
      parsed.value.pickup,
      parsed.value.destination,
      parsed.value.date,
      parsed.value.time,
      parsed.value.note,
      new Date().toISOString(),
    ],
  );
  return {
    ok: true as const,
    hire: {
      dateLabel: formatJourneyDate(parsed.value.date),
      time: parsed.value.time,
      pickup: parsed.value.pickup,
      destination: parsed.value.destination,
      note: parsed.value.note,
    },
  };
}
