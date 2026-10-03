export const TZ = "Europe/London";

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type Hour = { day: number; start: string; end: string };

export function money(pence: number | null | undefined) {
  if (pence == null) return "To be confirmed";
  return `£${(pence / 100).toFixed(2)}`;
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function londonToIso(value: string) {
  const match = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/.exec(value);
  if (!match) throw new Error("Choose a valid London date and time.");
  const [, y, mo, d, h, mi] = match.map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const candidates = [wall, wall - 3600000].filter((time) => {
    const parts = format.formatToParts(new Date(time));
    const part = (name: string) => Number(parts.find((item) => item.type === name)?.value);
    return part("year") === y && part("month") === mo && part("day") === d && part("hour") === h && part("minute") === mi;
  });
  if (candidates.length !== 1) {
    throw new Error("That London time is skipped or repeated when the clocks change. Choose a time outside that hour.");
  }
  return new Date(candidates[0]).toISOString();
}

function londonParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (key: string) => parts.find((part) => part.type === key)?.value ?? "";
  return {
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")),
    time: `${get("hour")}:${get("minute")}`,
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export function withinHours(start: Date, end: Date, hours: Hour[]) {
  const a = londonParts(start);
  const b = londonParts(end);
  return a.date === b.date && hours.some((hour) => hour.day === a.day && hour.start <= a.time && hour.end >= b.time);
}

export function asHours(value: unknown): Hour[] {
  const source = typeof value === "string" ? safeParse(value) : value;
  if (!Array.isArray(source)) return [];
  return source.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const hour = item as { day?: unknown; start?: unknown; end?: unknown };
    const day = Number(hour.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) return [];
    if (typeof hour.start !== "string" || typeof hour.end !== "string") return [];
    if (!/^\d{2}:\d{2}$/.test(hour.start) || !/^\d{2}:\d{2}$/.test(hour.end)) return [];
    return [{ day, start: hour.start, end: hour.end }];
  });
}

export function validateHours(hours: Hour[]) {
  for (const hour of hours) {
    if (hour.start >= hour.end) throw new Error("A working period must finish after it starts. Split an overnight shift across two days.");
  }
  for (let i = 0; i < hours.length; i += 1) {
    for (let j = i + 1; j < hours.length; j += 1) {
      const a = hours[i];
      const b = hours[j];
      if (a.day === b.day && a.start < b.end && b.start < a.end) {
        throw new Error("Working periods on the same day cannot overlap.");
      }
    }
  }
}

function safeParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return [];
  }
}
