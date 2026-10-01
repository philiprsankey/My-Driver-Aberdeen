import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/AccountForm";
import { getCurrentMember } from "@/lib/auth";
import { planById } from "@/lib/site";
import { signUp } from "./actions";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const chosen = planById((await searchParams).plan ?? "");
  if (await getCurrentMember()) redirect(chosen ? `/join/${chosen.id}` : "/account");

  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <p className="text-xs tracking-[0.28em] text-gold uppercase">Membership</p>
      <h1 className="mt-3 font-display text-5xl uppercase leading-none text-ivory">Create an account</h1>
      <p className="mt-4 leading-relaxed text-muted">
        {chosen
          ? `You are joining as a ${chosen.name}, at £${chosen.price} a month. We will email you a 6-digit code to confirm your address.`
          : "We will email you a 6-digit code to confirm your address. Membership payment comes after that."}
      </p>
      <AccountForm
        action={signUp}
        submitLabel="Send code"
        pendingLabel="Sending code"
        fields={[
          { name: "name", label: "Name", type: "text", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
          { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="mt-6 text-sm text-muted">
        Already registered?{" "}
        <Link href="/sign-in" className="text-gold transition hover:text-gold-bright">
          Sign in
        </Link>
      </p>
    </main>
  );
}
