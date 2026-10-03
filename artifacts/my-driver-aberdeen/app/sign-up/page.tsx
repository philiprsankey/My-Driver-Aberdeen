import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { pendingSignupEmail } from "@/lib/verification";
import { AuthScreen, CodeForm, SignUpForm } from "../auth/forms";
import "../auth/auth.css";

export const metadata: Metadata = { title: "Create an account | My Driver Aberdeen", robots: { index: false } };

export default async function Page() {
  if (await getCurrentAccount()) redirect("/account/");
  const pending = await pendingSignupEmail();
  return pending ? (
    <AuthScreen title="Enter your code" subtitle="Check your email for the 6-digit code">
      <CodeForm email={pending} />
    </AuthScreen>
  ) : (
    <AuthScreen title="Create your account" subtitle="Book and track journeys with My Driver Aberdeen">
      <SignUpForm />
    </AuthScreen>
  );
}
