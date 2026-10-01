import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/AccountForm";
import { getCurrentMember, rememberedEmail } from "@/lib/auth";
import { signIn } from "./actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  if (await getCurrentMember()) redirect("/account");

  const email = await rememberedEmail();

  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <p className="text-xs tracking-[0.28em] text-gold uppercase">Membership</p>
      <h1 className="mt-3 font-display text-5xl uppercase leading-none text-ivory">Sign in</h1>
      <p className="mt-4 leading-relaxed text-muted">Use the email and password from your account.</p>
      <AccountForm
        action={signIn}
        submitLabel="Sign in"
        pendingLabel="Signing in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email", defaultValue: email },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link href="/sign-up" className="text-gold transition hover:text-gold-bright">
          Create an account
        </Link>
      </p>
    </main>
  );
}
