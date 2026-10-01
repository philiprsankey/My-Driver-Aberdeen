import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VerifyCodeForm } from "@/components/VerifyCodeForm";
import { getCurrentMember } from "@/lib/auth";
import { pendingSignupEmail } from "@/lib/verification";
import { confirmCode, resendCode } from "./actions";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifySignUpPage() {
  if (await getCurrentMember()) redirect("/account");
  const email = await pendingSignupEmail();

  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <p className="text-xs tracking-[0.28em] text-gold uppercase">Membership</p>
      <h1 className="mt-3 font-display text-5xl uppercase leading-none text-ivory">Enter your code</h1>
      {email ? (
        <>
          <p className="mt-4 leading-relaxed text-muted">
            We sent a 6-digit code to {email}. It expires in 10 minutes.
          </p>
          <VerifyCodeForm confirmAction={confirmCode} resendAction={resendCode} />
        </>
      ) : (
        <p className="mt-4 leading-relaxed text-muted">
          Enter your details first so we can send a code.{" "}
          <Link href="/sign-up" className="text-gold transition hover:text-gold-bright">
            Create an account
          </Link>
          .
        </p>
      )}
    </main>
  );
}
