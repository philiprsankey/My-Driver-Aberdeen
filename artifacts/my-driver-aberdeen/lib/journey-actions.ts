"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAccount } from "@/lib/auth";
import { londonToIso, type Hour } from "@/lib/london";
import {
  addTimeOff,
  approveJourney,
  assignJourney,
  cancelJourney,
  completeJourney,
  declineJourney,
  JourneyError,
  markNoticesRead,
  removeTimeOff,
  requestJourney,
  saveHours,
  saveProfile,
  saveRole,
} from "@/lib/journeys";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

async function run(work: (userId: string) => Promise<string>): Promise<ActionResult> {
  const account = await getCurrentAccount();
  if (!account) return { ok: false, error: "Please sign in again." };
  try {
    const message = await work(account.id);
    revalidatePath("/account");
    return { ok: true, message };
  } catch (error) {
    if (error instanceof JourneyError || error instanceof Error && /London|working period|overlap/i.test(error.message)) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function requestJourneyAction(input: {
  pickup: string;
  destination: string;
  when: string;
  returnWhen: string;
  phone: string;
  notes: string;
  fareDestination: string;
  useMembership: boolean;
}): Promise<ActionResult> {
  return run(async (userId) => {
    const pickupAt = londonToIso(input.when);
    const returnAt = input.returnWhen ? londonToIso(input.returnWhen) : undefined;
    return requestJourney(userId, {
      pickup: input.pickup,
      destination: input.destination,
      pickupAt,
      returnAt,
      phone: input.phone,
      notes: input.notes,
      fareDestination: input.fareDestination || null,
      useMembership: input.useMembership,
    });
  });
}

export async function cancelJourneyAction(id: string) {
  return run((userId) => cancelJourney(userId, id));
}

export async function declineJourneyAction(id: string, reason: string) {
  return run((userId) => declineJourney(userId, id, reason));
}

export async function assignJourneyAction(id: string, driverId: string) {
  return run((userId) => assignJourney(userId, id, driverId));
}

export async function approveJourneyAction(input: {
  id: string;
  driverId: string;
  durationMinutes: number;
  bufferMinutes: number;
  membershipEligible: boolean;
  amountPounds: number | null;
}) {
  return run((userId) => approveJourney(userId, input));
}

export async function completeJourneyAction(id: string) {
  return run((userId) => completeJourney(userId, id));
}

export async function saveProfileAction(name: string, phone: string) {
  return run((userId) => saveProfile(userId, name, phone));
}

export async function saveHoursAction(input: {
  scope: "company" | "priority" | "driver";
  driverId?: string;
  minimumNoticeHours?: number;
  paymentHoldMinutes?: number;
  hours: Hour[];
}) {
  return run((userId) => saveHours(userId, input));
}

export async function saveRoleAction(personId: string, role: "customer" | "driver", active: boolean) {
  return run((userId) => saveRole(userId, personId, role, active));
}

export async function addTimeOffAction(input: { driverId?: string; start: string; end: string; label: string }) {
  return run((userId) => addTimeOff(userId, {
    driverId: input.driverId,
    startAt: londonToIso(input.start),
    endAt: londonToIso(input.end),
    label: input.label,
  }));
}

export async function removeTimeOffAction(id: string) {
  return run((userId) => removeTimeOff(userId, id));
}

export async function markNoticesReadAction() {
  return run(async (userId) => {
    await markNoticesRead(userId);
    return "Alerts marked as read.";
  });
}
