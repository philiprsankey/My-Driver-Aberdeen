"use server";

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { validateNewAccount } from "@/lib/account-validation";
import { beginEmailVerification } from "@/lib/verification";

export type AuthState = {
  error: string;
  values: Record<string, string>;
  attempt: number;
};

export async function signUp(state: AuthState, formData: FormData): Promise<AuthState> {
  const existing = await getCurrentMember();
  if (existing) redirect("/account");

  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };
  const failed = (error: string): AuthState => ({
    error,
    values,
    attempt: state.attempt + 1,
  });

  const parsed = validateNewAccount(values);
  if (!parsed.ok) return failed(parsed.error);

  const started = await beginEmailVerification(parsed.value);
  if (!started.ok) return failed(started.error);
  redirect("/sign-up/verify");
}
