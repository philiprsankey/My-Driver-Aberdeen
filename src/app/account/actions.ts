"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { endSession, getCurrentMember } from "@/lib/auth";
import { originFrom } from "@/lib/site";
import { getStripe, openCustomerPortal } from "@/lib/billing";
import { createHireRequest } from "@/lib/bookings";
import { sendHireRequestEmails } from "@/lib/mail";

export type BookingState = {
  error: string;
  values: Record<string, string>;
  attempt: number;
};

export async function signOut() {
  await endSession();
  redirect("/");
}

export async function manageMembership() {
  const member = await getCurrentMember();
  if (!member?.stripeCustomerId || !getStripe()) redirect("/account?billing=unavailable");

  let url = "";
  try {
    url = await openCustomerPortal(member.stripeCustomerId, originFrom(await headers()));
  } catch (error) {
    console.error("Stripe billing portal failed", error instanceof Error ? error.message : "");
    redirect("/account?billing=failed");
  }
  redirect(url);
}

export async function requestHire(state: BookingState, formData: FormData): Promise<BookingState> {
  const member = await getCurrentMember();
  if (!member) redirect("/sign-in");

  const values = {
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    pickup: String(formData.get("pickup") ?? ""),
    destination: String(formData.get("destination") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
  const result = await createHireRequest(member, values);
  if (!result.ok) return { error: result.error, values, attempt: state.attempt + 1 };

  let mailed = false;
  try {
    mailed = (
      await sendHireRequestEmails({
        memberName: member.name,
        memberEmail: member.email,
        ...result.hire,
      })
    ).ok;
  } catch (error) {
    console.error("Hire email failed", error instanceof Error ? error.message : "");
  }
  redirect(mailed ? "/account?requested=1" : "/account?requested=1&mail=0");
}
