import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { fulfillCheckoutSession, syncMembership } from "@/lib/billing";
import { loadPortal } from "@/lib/journeys";
import SiteHeader from "../site-header";
import AccountDesk from "./desk";
import "./account.css";

export const metadata: Metadata = { title: "Your account | My Driver Aberdeen", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ session_id?: string; notice?: string }> }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/sign-in/?next=/account/");
  const params = await searchParams;
  if (params.session_id) {
    try {
      await fulfillCheckoutSession(params.session_id, account.id);
    } catch {
      redirect("/account/?notice=pay");
    }
    redirect("/account/");
  }
  try {
    await syncMembership(account.id);
  } catch {
    // The account still opens if Stripe cannot be reached.
  }
  const portal = await loadPortal(account.id);
  return (
    <>
      <SiteHeader solid base="/" signedIn />
      <main className="acct">
        <AccountDesk portal={portal} notice={params.notice ?? ""} />
      </main>
    </>
  );
}
