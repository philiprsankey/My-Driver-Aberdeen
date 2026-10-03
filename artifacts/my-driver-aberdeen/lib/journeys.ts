import { randomUUID } from "node:crypto";
import { ensureOwner } from "@/lib/auth";
import { dbAll, dbOne, dbTransaction } from "@/lib/db";
import { asHours, validateHours, withinHours, type Hour } from "@/lib/london";
import { stripeTestMode } from "@/lib/billing";
import { FARES, type Journey, type MembershipView, type Notice, type Person, type PortalData, type TimeOff } from "@/lib/journey-types";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  working_hours: unknown;
};

type BookingRow = {
  id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  pickup: string;
  destination: string;
  pickup_at: string;
  status: string;
  payment_status: string;
  amount_pence: number | null;
  driver_id: string | null;
  driver_name: string | null;
  use_membership: boolean;
  priority: boolean;
  duration_minutes: number | null;
  buffer_minutes: number;
  notes: string;
  fare_destination: string | null;
  hold_until: string | null;
  created_at: string;
};

type SettingsRow = {
  minimum_notice_hours: number | null;
  payment_hold_minutes: number;
  working_hours: unknown;
  priority_hours: unknown;
};

export class JourneyError extends Error {}

const phonePattern = /^[+\d\s()-]{7,30}$/;

function iso(value: string | Date) {
  return new Date(value).toISOString();
}

function person(row: UserRow): Person {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    role: row.role,
    active: row.active,
    workingHours: asHours(row.working_hours),
  };
}

function journey(row: BookingRow): Journey {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name ?? "",
    phone: row.phone,
    pickup: row.pickup,
    destination: row.destination,
    pickupAt: iso(row.pickup_at),
    status: row.status,
    paymentStatus: row.payment_status,
    amountPence: row.amount_pence,
    driverId: row.driver_id,
    driverName: row.driver_name,
    useMembership: row.use_membership,
    priority: row.priority,
    durationMinutes: row.duration_minutes,
    bufferMinutes: row.buffer_minutes,
    notes: row.notes,
    fareDestination: row.fare_destination,
    holdUntil: row.hold_until ? iso(row.hold_until) : null,
    createdAt: iso(row.created_at),
  };
}

async function requireUser(userId: string) {
  const row = await dbOne<UserRow>("SELECT * FROM account_users WHERE id = $1 AND active", [userId]);
  if (!row) throw new JourneyError("This account is not available.");
  return person(row);
}

async function settingsRow() {
  const row = await dbOne<SettingsRow>("SELECT * FROM operational_settings WHERE id = 1");
  if (!row) throw new JourneyError("Operating hours are not available just now.");
  const workingHours = asHours(row.working_hours);
  return {
    configured: row.minimum_notice_hours !== null && workingHours.length > 0,
    minimumNoticeHours: row.minimum_notice_hours,
    paymentHoldMinutes: row.payment_hold_minutes,
    workingHours,
    priorityHours: asHours(row.priority_hours),
  };
}

async function membershipFor(userId: string): Promise<MembershipView | null> {
  const allowance = await dbOne<{
    id: string;
    plan: string | null;
    granted: number;
    period_start: string;
    period_end: string;
  }>(
    `SELECT hire_allowances.id, hire_allowances.plan, hire_allowances.granted, hire_allowances.period_start, hire_allowances.period_end
     FROM hire_allowances
     JOIN account_users ON account_users.id = hire_allowances.user_id
     WHERE hire_allowances.user_id = $1
       AND hire_allowances.period_start <= NOW() AND hire_allowances.period_end > NOW()
       AND account_users.subscription_status IN ('active', 'trialing')
     ORDER BY hire_allowances.period_end DESC LIMIT 1`,
    [userId],
  );
  if (!allowance) return null;
  const counts = await dbOne<{ used: number; reserved: number }>(
    `SELECT COUNT(*)::int AS used,
            COUNT(*) FILTER (WHERE status = 'confirmed' AND pickup_at > NOW())::int AS reserved
     FROM journey_bookings WHERE allowance_id = $1 AND consumes_hire`,
    [allowance.id],
  );
  const used = Number(counts?.used ?? 0);
  return {
    plan: allowance.plan === "priority" ? "priority" : "member",
    periodStart: iso(allowance.period_start),
    periodEnd: iso(allowance.period_end),
    remainingHires: Math.max(0, Number(allowance.granted) - used),
    reservedHires: Number(counts?.reserved ?? 0),
    allowanceId: allowance.id,
  };
}

async function notify(userIds: string[], message: string) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  await dbTransaction(
    unique.map((userId) => ({
      text: "INSERT INTO account_notifications (id, user_id, message) VALUES ($1, $2, $3)",
      params: [randomUUID(), userId, message],
    })),
  );
}

async function adminIds() {
  const rows = await dbAll<{ id: string }>("SELECT id FROM account_users WHERE role = 'admin' AND active");
  return rows.map((row) => row.id);
}

export async function loadPortal(userId: string): Promise<PortalData> {
  await ensureOwner();
  const user = await requireUser(userId);
  const settings = await settingsRow();
  const membership = await membershipFor(user.id);
  const condition = user.role === "admin" ? "TRUE" : user.role === "driver" ? "b.driver_id = $1" : "b.customer_id = $1";
  const params = user.role === "admin" ? [] : [user.id];
  const rows = await dbAll<BookingRow>(
    `SELECT b.*, c.name AS customer_name, d.name AS driver_name
     FROM journey_bookings b
     JOIN account_users c ON c.id = b.customer_id
     LEFT JOIN account_users d ON d.id = b.driver_id
     WHERE ${condition}
     ORDER BY CASE WHEN b.status IN ('requested', 'payment_expired') THEN 0 ELSE 1 END, b.pickup_at ASC
     LIMIT 500`,
    params,
  );
  const people = user.role === "admin"
    ? (await dbAll<UserRow>("SELECT * FROM account_users ORDER BY name LIMIT 200")).map(person)
    : [];
  const drivers = user.role === "admin"
    ? people.filter((item) => item.role === "driver" || item.role === "admin")
    : user.role === "driver"
      ? [user]
      : [];
  const blocks = user.role === "customer"
    ? []
    : await dbAll<{ id: string; driver_id: string; start_at: string; end_at: string; label: string }>(
      user.role === "admin"
        ? "SELECT * FROM driver_blocks WHERE end_at > NOW() ORDER BY start_at"
        : "SELECT * FROM driver_blocks WHERE driver_id = $1 AND end_at > NOW() ORDER BY start_at",
      user.role === "admin" ? [] : [user.id],
    );
  const notices = await dbAll<{ id: string; message: string; created_at: string; read: boolean }>(
    "SELECT * FROM account_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
    [user.id],
  );
  return {
    user,
    membership,
    journeys: rows.map(journey),
    people,
    drivers,
    timeOff: blocks.map((block) => ({
      id: block.id,
      driverId: block.driver_id,
      startAt: iso(block.start_at),
      endAt: iso(block.end_at),
      label: block.label,
    })),
    notices: notices.map((notice): Notice => ({
      id: notice.id,
      message: notice.message,
      createdAt: iso(notice.created_at),
      read: notice.read,
    })),
    settings,
    fares: FARES,
    stripeTest: stripeTestMode(),
  };
}

export async function requestJourney(userId: string, input: {
  pickup: string;
  destination: string;
  pickupAt: string;
  returnAt?: string;
  phone: string;
  notes: string;
  fareDestination: string | null;
  useMembership: boolean;
}) {
  const user = await requireUser(userId);
  if (user.role !== "customer") throw new JourneyError("Journey requests are made from a member account.");
  if (!phonePattern.test(input.phone)) throw new JourneyError("Enter a valid contact phone number.");
  const settings = await settingsRow();
  if (!settings.configured || settings.minimumNoticeHours === null) {
    throw new JourneyError("Online requests open once working hours are set. Please call or text 07822 011848 meanwhile.");
  }
  const recent = await dbOne<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM journey_bookings WHERE customer_id = $1 AND created_at > NOW() - INTERVAL '1 minute'",
    [user.id],
  );
  if (Number(recent?.n ?? 0) >= 5) throw new JourneyError("Please wait a minute before sending more requests.");
  const start = new Date(input.pickupAt);
  const returnAt = input.returnAt ? new Date(input.returnAt) : null;
  const now = Date.now();
  if (Number.isNaN(+start) || start.getTime() < now + settings.minimumNoticeHours * 3600000) {
    throw new JourneyError(`Journeys need at least ${settings.minimumNoticeHours} hours' notice.`);
  }
  if (start.getTime() > now + 365 * 86400000) throw new JourneyError("Please book within the next 12 months.");
  if (returnAt && (Number.isNaN(+returnAt) || returnAt <= start || returnAt.getTime() > now + 365 * 86400000)) {
    throw new JourneyError("The return must be after the outward pickup and within 12 months.");
  }
  const pickup = input.pickup.trim();
  const destination = input.destination.trim();
  if (pickup.length < 3 || destination.length < 3) throw new JourneyError("Enter a pickup and a destination.");
  const member = input.useMembership ? await membershipFor(user.id) : null;
  const legs = returnAt ? 2 : 1;
  if (input.useMembership && (!member || member.remainingHires < legs)) {
    throw new JourneyError("You do not have enough included hires left for this request.");
  }
  if (member && (start >= new Date(member.periodEnd) || (returnAt && returnAt >= new Date(member.periodEnd)))) {
    throw new JourneyError("Included journeys must fall inside the current membership period.");
  }
  const fare = input.fareDestination ? FARES.find((item) => item.destination === input.fareDestination) : undefined;
  if (input.fareDestination && !fare) throw new JourneyError("Choose a fare from the list.");
  const groupId = returnAt ? randomUUID() : null;
  const staff = await adminIds();
  const legsToSave: [string, string, Date][] = [[pickup, destination, start]];
  if (returnAt) legsToSave.push([destination, pickup, returnAt]);
  await dbTransaction([
    ...legsToSave.map(([from, to, when]) => ({
      text: `INSERT INTO journey_bookings
        (id, customer_id, group_id, pickup, destination, pickup_at, phone, notes, use_membership, fare_destination, amount_pence, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      params: [
        randomUUID(),
        user.id,
        groupId,
        from,
        to,
        when.toISOString(),
        input.phone.trim(),
        input.notes.trim(),
        input.useMembership,
        fare?.destination ?? null,
        fare?.amountPence ?? null,
        member?.plan === "priority",
      ],
    })),
    {
      text: "UPDATE account_users SET phone = $2 WHERE id = $1",
      params: [user.id, input.phone.trim()],
    },
  ]);
  await notify(
    [user.id, ...staff],
    returnAt
      ? "Your outward and return requests have been saved. Each one needs driver approval."
      : "Your journey request has been saved and is awaiting driver approval. It is not confirmed yet.",
  );
  return returnAt
    ? "Two requests have been saved. Neither is confirmed until your driver approves it."
    : "Your request has been saved. It is not confirmed until your driver approves it.";
}

async function loadOwned(user: Person, id: string) {
  const row = await dbOne<BookingRow & { customer_id: string; driver_id: string | null }>(
    `SELECT b.*, c.name AS customer_name, d.name AS driver_name
     FROM journey_bookings b
     JOIN account_users c ON c.id = b.customer_id
     LEFT JOIN account_users d ON d.id = b.driver_id
     WHERE b.id = $1`,
    [id],
  );
  if (!row) throw new JourneyError("That journey could not be found.");
  const staff = user.role === "admin" || (user.role === "driver" && row.driver_id === user.id);
  const owner = row.customer_id === user.id;
  if (!staff && !owner) throw new JourneyError("That journey could not be found.");
  return { row, staff, owner };
}

export async function cancelJourney(userId: string, id: string) {
  const user = await requireUser(userId);
  const { row, staff } = await loadOwned(user, id);
  if (!["requested", "payment_expired", "awaiting_payment", "confirmed"].includes(row.status)) {
    throw new JourneyError("This journey cannot be cancelled.");
  }
  const inTime = new Date(row.pickup_at).getTime() - Date.now() >= 24 * 3600000;
  const restore = staff || inTime;
  await dbOne(
    `UPDATE journey_bookings
     SET status = 'cancelled', hold_until = NULL, consumes_hire = CASE WHEN $2 THEN FALSE ELSE consumes_hire END
     WHERE id = $1`,
    [id, restore],
  );
  const message = restore
    ? "Journey cancelled. An included hire is restored when the cancellation is at least 24 hours before pickup."
    : "Journey cancelled within 24 hours of pickup. The included hire is not restored.";
  await notify([row.customer_id, row.driver_id ?? "", ...(await adminIds())], message);
  return message;
}

export async function declineJourney(userId: string, id: string, reason: string) {
  const user = await requireUser(userId);
  const { row, staff } = await loadOwned(user, id);
  if (!staff) throw new JourneyError("Only the assigned driver or the owner can decline a request.");
  if (!["requested", "payment_expired"].includes(row.status)) throw new JourneyError("Only a request that is still open can be declined.");
  await dbOne("UPDATE journey_bookings SET status = 'declined' WHERE id = $1", [id]);
  const message = reason.trim() ? `Journey request declined. ${reason.trim()}` : "Journey request declined.";
  await notify([row.customer_id, row.driver_id ?? "", ...(await adminIds())], message);
  return message;
}

export async function assignJourney(userId: string, id: string, driverId: string) {
  const user = await requireUser(userId);
  if (user.role !== "admin") throw new JourneyError("Only the owner can assign a driver.");
  const { row } = await loadOwned(user, id);
  if (!["requested", "payment_expired"].includes(row.status)) throw new JourneyError("Only an open request can be assigned.");
  const driver = await dbOne("SELECT id FROM account_users WHERE id = $1 AND role IN ('driver', 'admin') AND active", [driverId]);
  if (!driver) throw new JourneyError("Choose an active driver.");
  await dbOne("UPDATE journey_bookings SET driver_id = $2 WHERE id = $1", [id, driverId]);
  await notify([driverId, row.customer_id], "A journey request has been assigned and is awaiting approval.");
  return "The request has been assigned.";
}

export async function approveJourney(userId: string, input: {
  id: string;
  driverId: string;
  durationMinutes: number;
  bufferMinutes: number;
  membershipEligible: boolean;
  amountPounds: number | null;
}) {
  const user = await requireUser(userId);
  if (user.role !== "admin" && user.role !== "driver") throw new JourneyError("Only a driver can approve a request.");
  const { row } = await loadOwned(user, input.id);
  if (user.role === "driver" && row.driver_id !== user.id) throw new JourneyError("You can approve only journeys assigned to you.");
  if (!["requested", "payment_expired"].includes(row.status)) throw new JourneyError("This journey is not awaiting approval.");
  const settings = await settingsRow();
  if (!settings.configured) throw new JourneyError("Set working hours and notice before approving journeys.");
  const driverId = user.role === "driver" ? user.id : input.driverId || row.driver_id;
  if (!driverId) throw new JourneyError("Choose a driver.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 10 || input.durationMinutes > 720) {
    throw new JourneyError("Enter a journey length between 10 and 720 minutes.");
  }
  if (!Number.isInteger(input.bufferMinutes) || input.bufferMinutes < 0 || input.bufferMinutes > 180) {
    throw new JourneyError("Enter a travel buffer between 0 and 180 minutes.");
  }
  const driver = await dbOne<UserRow>("SELECT * FROM account_users WHERE id = $1 AND role IN ('driver', 'admin') AND active", [driverId]);
  if (!driver) throw new JourneyError("Choose an active driver.");
  const pickup = new Date(row.pickup_at);
  if (pickup.getTime() <= Date.now()) throw new JourneyError("The pickup time has already passed.");
  const start = new Date(pickup.getTime() - input.bufferMinutes * 60000);
  const end = new Date(pickup.getTime() + (input.durationMinutes + input.bufferMinutes) * 60000);
  const member = row.use_membership ? await membershipFor(row.customer_id) : null;
  const ownHours = asHours(driver.working_hours);
  const hours: Hour[] = ownHours.length
    ? ownHours
    : [...settings.workingHours, ...(member?.plan === "priority" ? settings.priorityHours : [])];
  if (!withinHours(start, end, hours)) {
    throw new JourneyError("The journey and the travel buffer must sit inside working hours.");
  }
  const overlap = await dbOne(
    `SELECT id FROM journey_bookings
     WHERE driver_id = $1 AND id <> $4 AND status IN ('confirmed', 'awaiting_payment')
       AND pickup_at - buffer_minutes * INTERVAL '1 minute' < $3
       AND pickup_at + (duration_minutes + buffer_minutes) * INTERVAL '1 minute' > $2
     LIMIT 1`,
    [driverId, start.toISOString(), end.toISOString(), row.id],
  );
  const blocked = await dbOne(
    "SELECT id FROM driver_blocks WHERE driver_id = $1 AND start_at < $3 AND end_at > $2 LIMIT 1",
    [driverId, start.toISOString(), end.toISOString()],
  );
  if (overlap || blocked) throw new JourneyError("This driver is already committed during that journey and travel buffer.");
  if (row.use_membership) {
    if (!input.membershipEligible) throw new JourneyError("Confirm that this journey is inside the Aberdeen and 10-mile membership area.");
    if (!member || pickup >= new Date(member.periodEnd) || pickup < new Date(member.periodStart)) {
      throw new JourneyError("This pickup sits outside the current membership period.");
    }
    const saved = await dbOne(
      `UPDATE journey_bookings SET
         driver_id = $2, duration_minutes = $3, buffer_minutes = $4, amount_pence = 0,
         status = 'confirmed', payment_status = 'included', allowance_id = $5, consumes_hire = TRUE,
         hold_until = NULL, approval_version = approval_version + 1
       WHERE id = $1 AND status IN ('requested', 'payment_expired')
         AND (SELECT COUNT(*) FROM journey_bookings WHERE allowance_id = $5 AND consumes_hire) < 5
       RETURNING id`,
      [row.id, driverId, input.durationMinutes, input.bufferMinutes, member.allowanceId],
    );
    if (!saved) throw new JourneyError("All five included hires are already reserved or used.");
    const message = "Journey confirmed with one included hire.";
    await notify([row.customer_id, driverId, ...(await adminIds())], message);
    return message;
  }
  const amountPence = row.fare_destination
    ? row.amount_pence
    : input.amountPounds == null
      ? null
      : Math.round(input.amountPounds * 100);
  if (amountPence == null || amountPence <= 0 || amountPence > 100000) {
    throw new JourneyError("Enter the agreed fare for this destination.");
  }
  const holdMinutes = Math.min(settings.paymentHoldMinutes, 1440);
  const hold = new Date(Math.min(Date.now() + holdMinutes * 60000, pickup.getTime()));
  await dbOne(
    `UPDATE journey_bookings SET
       driver_id = $2, duration_minutes = $3, buffer_minutes = $4, amount_pence = $5,
       status = 'awaiting_payment', payment_status = 'unpaid', allowance_id = NULL, consumes_hire = FALSE,
       hold_until = $6, approval_version = approval_version + 1
     WHERE id = $1 AND status IN ('requested', 'payment_expired')`,
    [row.id, driverId, input.durationMinutes, input.bufferMinutes, amountPence, hold.toISOString()],
  );
  const message = "Journey approved. Card payment is the next step, so this journey is not confirmed yet.";
  await notify([row.customer_id, driverId, ...(await adminIds())], message);
  return message;
}

export async function completeJourney(userId: string, id: string) {
  const user = await requireUser(userId);
  const { row, staff } = await loadOwned(user, id);
  if (!staff) throw new JourneyError("Only the driver can complete a journey.");
  if (row.status !== "confirmed" || new Date(row.pickup_at) > new Date()) {
    throw new JourneyError("Only a confirmed journey after its pickup time can be completed.");
  }
  await dbOne("UPDATE journey_bookings SET status = 'completed' WHERE id = $1", [id]);
  const message = "Journey marked complete.";
  await notify([row.customer_id, row.driver_id ?? ""], message);
  return message;
}

export async function saveProfile(userId: string, name: string, phone: string) {
  const user = await requireUser(userId);
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 80) throw new JourneyError("Enter the name we should use.");
  if (!phonePattern.test(phone)) throw new JourneyError("Enter a valid contact phone number.");
  await dbOne("UPDATE account_users SET name = $2, phone = $3 WHERE id = $1", [user.id, cleanName, phone.trim()]);
  return "Your details have been saved.";
}

export async function saveHours(userId: string, input: {
  scope: "company" | "priority" | "driver";
  driverId?: string;
  minimumNoticeHours?: number;
  paymentHoldMinutes?: number;
  hours: Hour[];
}) {
  const user = await requireUser(userId);
  validateHours(input.hours);
  if (input.scope === "driver") {
    const driverId = user.role === "driver" ? user.id : input.driverId;
    if (user.role !== "admin" && user.role !== "driver") throw new JourneyError("Working hours can be saved by the owner or a driver.");
    if (!driverId) throw new JourneyError("Choose a driver.");
    if (user.role === "driver" && driverId !== user.id) throw new JourneyError("You can edit only your own hours.");
    await dbOne("UPDATE account_users SET working_hours = $2::jsonb WHERE id = $1 AND role IN ('driver', 'admin')", [
      driverId,
      JSON.stringify(input.hours),
    ]);
    return input.hours.length ? "Those working hours have been saved." : "Those hours now follow the company week.";
  }
  if (user.role !== "admin") throw new JourneyError("Only the owner can change company hours.");
  const current = await settingsRow();
  const workingHours = input.scope === "company" ? input.hours : current.workingHours;
  const priorityHours = input.scope === "priority" ? input.hours : current.priorityHours;
  const notice = input.scope === "company" ? input.minimumNoticeHours : current.minimumNoticeHours;
  const hold = input.scope === "company" ? input.paymentHoldMinutes : current.paymentHoldMinutes;
  if (input.scope === "company") {
    if (notice == null || !Number.isInteger(notice) || notice < 1 || notice > 168) {
      throw new JourneyError("Enter a minimum notice between 1 and 168 hours.");
    }
    if (!workingHours.length) throw new JourneyError("Add at least one working period.");
    if (hold == null || !Number.isInteger(hold) || hold < 30 || hold > 1440) {
      throw new JourneyError("The payment hold must be between 30 and 1440 minutes.");
    }
  }
  validateHours(priorityHours);
  await dbOne(
    `UPDATE operational_settings
     SET minimum_notice_hours = $1, payment_hold_minutes = $2, working_hours = $3::jsonb, priority_hours = $4::jsonb
     WHERE id = 1`,
    [notice, hold ?? 60, JSON.stringify(workingHours), JSON.stringify(priorityHours)],
  );
  return "Working hours have been saved.";
}

export async function saveRole(userId: string, personId: string, role: "customer" | "driver", active: boolean) {
  const user = await requireUser(userId);
  if (user.role !== "admin") throw new JourneyError("Only the owner can change access.");
  if (personId === user.id) throw new JourneyError("Your own access stays as owner.");
  const target = await dbOne<UserRow>("SELECT * FROM account_users WHERE id = $1", [personId]);
  if (!target || target.role === "admin") throw new JourneyError("That account cannot be changed here.");
  if ((!active || role !== "driver") && target.role === "driver") {
    const upcoming = await dbOne(
      "SELECT id FROM journey_bookings WHERE driver_id = $1 AND status IN ('confirmed', 'awaiting_payment') AND pickup_at > NOW() LIMIT 1",
      [personId],
    );
    if (upcoming) throw new JourneyError("Reassign this driver's upcoming journeys before removing driver access.");
  }
  await dbOne("UPDATE account_users SET role = $2, active = $3 WHERE id = $1", [personId, role, active]);
  return "Access has been saved.";
}

export async function addTimeOff(userId: string, input: { driverId?: string; startAt: string; endAt: string; label: string }) {
  const user = await requireUser(userId);
  if (user.role !== "admin" && user.role !== "driver") throw new JourneyError("Only a driver can mark time off.");
  const driverId = user.role === "driver" ? user.id : input.driverId;
  if (!driverId) throw new JourneyError("Choose a driver.");
  const start = new Date(input.startAt);
  const end = new Date(input.endAt);
  if (!(start < end) || end <= new Date()) throw new JourneyError("Choose a future period of time off.");
  const label = input.label.trim();
  if (label.length < 2 || label.length > 80) throw new JourneyError("Give the time off a short label.");
  const driver = await dbOne("SELECT id FROM account_users WHERE id = $1 AND role IN ('driver', 'admin') AND active", [driverId]);
  if (!driver) throw new JourneyError("Choose an active driver.");
  const clash = await dbOne(
    `SELECT id FROM journey_bookings WHERE driver_id = $1 AND status IN ('confirmed', 'awaiting_payment')
     AND pickup_at - buffer_minutes * INTERVAL '1 minute' < $3
     AND pickup_at + (duration_minutes + buffer_minutes) * INTERVAL '1 minute' > $2 LIMIT 1`,
    [driverId, start.toISOString(), end.toISOString()],
  );
  if (clash) throw new JourneyError("A confirmed journey already sits in that period.");
  await dbOne(
    "INSERT INTO driver_blocks (id, driver_id, start_at, end_at, label) VALUES ($1, $2, $3, $4, $5)",
    [randomUUID(), driverId, start.toISOString(), end.toISOString(), label],
  );
  return "Time off has been saved.";
}

export async function removeTimeOff(userId: string, id: string) {
  const user = await requireUser(userId);
  const removed = await dbOne(
    "DELETE FROM driver_blocks WHERE id = $1 AND ($2 = 'admin' OR driver_id = $3) RETURNING id",
    [id, user.role, user.id],
  );
  if (!removed) throw new JourneyError("That time off could not be found.");
  return "Time off has been removed.";
}

export async function markNoticesRead(userId: string) {
  await dbOne("UPDATE account_notifications SET read = TRUE WHERE user_id = $1", [userId]);
}
