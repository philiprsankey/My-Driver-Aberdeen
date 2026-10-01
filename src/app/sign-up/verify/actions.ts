"use server";

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { takePlanChoice } from "@/lib/billing";
import { confirmVerificationCode, resendVerificationCode } from "@/lib/verification";

export type VerifyState = { error: string; code: string; attempt: number };
export type ResendState = { error: string; notice: string };

export async function confirmCode(state: VerifyState, formData: FormData): Promise<VerifyState> {
  if (await getCurrentMember()) redirect("/account");
  const code = String(formData.get("code") ?? "");
  const result = await confirmVerificationCode(code);
  if (!result.ok) return { error: result.error, code, attempt: state.attempt + 1 };
  const plan = await takePlanChoice();
  redirect(plan ? `/join/${plan}` : "/account");
}

export async function resendCode(state: ResendState, _formData: FormData): Promise<ResendState> {
  if (await getCurrentMember()) redirect("/account");
  const result = await resendVerificationCode();
  if (!result.ok) return { error: result.error, notice: "" };
  return { ...state, error: "", notice: "A new code is on its way." };
}
