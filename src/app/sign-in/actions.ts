"use server";

import { redirect } from "next/navigation";
import { validateSignIn } from "@/lib/account-validation";
import { getCurrentMember, signInMember } from "@/lib/auth";

export type AuthState = {
  error: string;
  values: Record<string, string>;
  attempt: number;
};

export async function signIn(state: AuthState, formData: FormData): Promise<AuthState> {
  const existing = await getCurrentMember();
  if (existing) redirect("/account");

  const values = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const failed = (error: string): AuthState => ({
    error,
    values,
    attempt: state.attempt + 1,
  });

  const parsed = validateSignIn(values);
  if (!parsed.ok) return failed(parsed.error);

  const result = await signInMember(parsed.value.email, parsed.value.password);
  if (!result.ok) return failed(result.error);
  redirect("/account");
}
