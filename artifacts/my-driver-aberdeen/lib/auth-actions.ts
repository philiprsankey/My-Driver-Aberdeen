"use server";

import { redirect } from "next/navigation";
import { safeNextPath, validateNewAccount, validateSignIn } from "@/lib/account-validation";
import { endSession, signInAccount } from "@/lib/auth";
import { beginEmailVerification, confirmVerificationCode, resendVerificationCode } from "@/lib/verification";

export async function signInAction(formData: FormData) {
  const nextPath = safeNextPath(String(formData.get("next") ?? ""));
  const parsed = validateSignIn({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.ok) return { error: parsed.error };
  const result = await signInAccount(parsed.value.email, parsed.value.password);
  if (!result.ok) return { error: result.error };
  redirect(nextPath);
}

export async function signUpAction(formData: FormData) {
  const parsed = validateNewAccount({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.ok) return { error: parsed.error };
  const result = await beginEmailVerification(parsed.value);
  if (!result.ok) return { error: result.error };
  redirect("/sign-up/");
}

export async function confirmCodeAction(formData: FormData) {
  const result = await confirmVerificationCode(String(formData.get("code") ?? ""));
  if (!result.ok) return { error: result.error };
  redirect("/account/");
}

export async function resendCodeAction() {
  const result = await resendVerificationCode();
  if (!result.ok) return { error: result.error };
  return { ok: true as const };
}

export async function signOutAction() {
  await endSession();
  redirect("/");
}
