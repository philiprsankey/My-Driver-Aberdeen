import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { manageMembership, requestHire, signOut } from "@/app/account/actions";
import { BookingForm } from "@/components/BookingForm";
import { getCurrentMember } from "@/lib/auth";
import { fulfillCheckoutSession, membershipIsCurrent } from "@/lib/billing";
import { canRequestHire, formatJourneyDate, latestBookableDate, listHires, londonToday } from "@/lib/bookings";
import { planById, plans } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

const buttonClass =
  "inline-flex min-h-12 items-center justify-center px-6 text-sm font-medium tracking-[0.16em] uppercase transition";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; billing?: string; change?: string; requested?: string; mail?: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/sign-in");

  const params = await searchParams;
  if (params.session_id) {
    await fulfillCheckoutSession(params.session_id, member.id);
    redirect("/account");
  }

  const plan = member.plan ? planById(member.plan) : null;
  const current = membershipIsCurrent(member.subscriptionStatus) && plan !== null;
  const bookingOpen = canRequestHire(member.subscriptionStatus);
  const hires = bookingOpen ? listHires(member.id) : [];
  const notice =
    params.requested === "1"
      ? params.mail === "0"
        ? "Your hire request has been received. We could not send the email just now, and will confirm by phone or text."
        : "Your hire request has been received. A copy has been emailed to you. We will confirm by phone or text."
      :
    params.billing === "unavailable"
      ? "Card payment is not available yet. Please call or text to join."
      : params.billing === "failed"
        ? "The payment page could not be opened. Please try again, or call or text to join."
        : params.change === "1"
          ? "You already have a membership. Manage it below to change the plan or the card."
          : member.subscriptionStatus === "past_due"
            ? "Your membership payment did not go through. Manage membership to update the card."
            : member.subscriptionStatus === "canceled"
              ? "Your membership has ended. You can join again below."
              : "";

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-16">
      <p className="text-xs tracking-[0.28em] text-gold uppercase">Membership</p>
      <h1 className="mt-3 font-display text-5xl uppercase leading-none text-ivory">Your account</h1>
      <dl className="mt-8 space-y-4 border border-line px-5 py-6">
        <div>
          <dt className="text-xs tracking-[0.18em] text-gold uppercase">Name</dt>
          <dd className="mt-1 text-lg text-ivory">{member.name}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-[0.18em] text-gold uppercase">Email</dt>
          <dd className="mt-1 text-lg text-ivory">{member.email}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-[0.18em] text-gold uppercase">Membership</dt>
          <dd className="mt-1 text-lg text-ivory">
            {current && plan ? `${plan.name} · £${plan.price} a month` : "No active membership"}
          </dd>
        </div>
      </dl>
      {notice ? <p className="mt-6 leading-relaxed text-gold-bright">{notice}</p> : null}
      {current && member.stripeCustomerId ? (
        <form action={manageMembership} className="mt-6">
          <button
            type="submit"
            className={`${buttonClass} border border-line text-ivory hover:border-gold hover:text-gold-bright`}
          >
            Manage membership
          </button>
        </form>
      ) : null}
      {current ? null : (
        <div className="mt-6 space-y-3">
          <p className="leading-relaxed text-muted">Choose a membership to pay by card, or call or text to join.</p>
          {plans.map((choice) => (
            <a
              key={choice.id}
              href={`/join/${choice.id}`}
              className={`${buttonClass} w-full bg-gold text-black hover:bg-gold-bright`}
            >
              Join as {choice.name} · £{choice.price}
            </a>
          ))}
        </div>
      )}
      {bookingOpen ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl uppercase text-ivory">Request a hire</h2>
          <p className="mt-3 leading-relaxed text-muted">
            Tell us when and where. We email you a copy and confirm by phone or text.
          </p>
          <BookingForm action={requestHire} minDate={londonToday()} maxDate={latestBookableDate()} />
          <h2 className="mt-12 font-display text-3xl uppercase text-ivory">Your hires</h2>
          {hires.length === 0 ? (
            <p className="mt-4 text-muted">No hire requests yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {hires.map((hire) => (
                <li key={hire.id} className="border border-line px-5 py-4">
                  <p className="text-xs tracking-[0.16em] text-gold uppercase">
                    {formatJourneyDate(hire.journeyDate)} · {hire.journeyTime}
                  </p>
                  <p className="mt-2 break-words text-ivory">
                    {hire.pickup} to {hire.destination}
                  </p>
                  {hire.note ? <p className="mt-2 break-words text-sm text-muted">{hire.note}</p> : null}
                  <p className="mt-3 text-xs tracking-[0.16em] text-muted uppercase">Requested</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className={`${buttonClass} border border-line text-ivory hover:border-gold hover:text-gold-bright`}
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
