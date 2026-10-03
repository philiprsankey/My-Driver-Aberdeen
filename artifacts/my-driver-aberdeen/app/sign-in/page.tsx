import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/account-validation";
import { getCurrentAccount, rememberedEmail } from "@/lib/auth";
import { AuthScreen, SignInForm } from "../auth/forms";
import "../auth/auth.css";

export const metadata: Metadata = { title: "Sign in | My Driver Aberdeen", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentAccount()) redirect("/account/");
  const nextPath = safeNextPath((await searchParams).next);
  const email = await rememberedEmail();
  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to manage your journeys">
      <SignInForm nextPath={nextPath} email={email} />
    </AuthScreen>
  );
}
