import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { dbOne } from "@/lib/db";

const plans = {
  member: { name: "Member", pricePence: 10000, lookupKey: "mda-member-monthly" },
  priority: { name: "Priority Member", pricePence: 15000, lookupKey: "mda-priority-monthly" },
} as const;

export type PlanId = keyof typeof plans;

const globalForStripe = globalThis as unknown as { stripe?: Stripe };
const liveStatuses = new Set(["active", "trialing"]);

export function isPlanId(value: string): value is PlanId {
  return value === "member" || value === "priority";
}

export function stripeReady() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripeTestMode() {
  return process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) return null;
  globalForStripe.stripe ??= new Stripe(key);
  return globalForStripe.stripe;
}

function checkoutUrl(url: string | null) {
  if (!url?.startsWith("https://checkout.stripe.com/")) throw new Error("Stripe did not return a checkout page.");
  return url;
}

async function priceIdFor(planId: PlanId) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payments are not switched on.");
  const plan = plans[planId];
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const created = await stripe.prices.create({
    lookup_key: plan.lookupKey,
    currency: "gbp",
    unit_amount: plan.pricePence,
    recurring: { interval: "month" },
    product_data: { name: `${plan.name} — My Driver Aberdeen`, metadata: { planId } },
  });
  return created.id;
}

function planFromSubscription(subscription: Stripe.Subscription): PlanId | null {
  const fromMeta = subscription.metadata.planId ?? "";
  if (isPlanId(fromMeta)) return fromMeta;
  const key = subscription.items.data[0]?.price.lookup_key;
  if (key === plans.member.lookupKey) return "member";
  if (key === plans.priority.lookupKey) return "priority";
  return null;
}

function periodOf(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as { current_period_start?: number; current_period_end?: number } | undefined;
  const raw = subscription as Stripe.Subscription & { current_period_start?: number; current_period_end?: number };
  const start = item?.current_period_start ?? raw.current_period_start;
  const end = item?.current_period_end ?? raw.current_period_end;
  if (!start || !end) return null;
  return { start: new Date(start * 1000), end: new Date(end * 1000) };
}

async function customerIdFor(userId: string, email: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payments are not switched on.");
  const row = await dbOne<{ stripe_customer_id: string | null }>("SELECT stripe_customer_id FROM account_users WHERE id = $1", [userId]);
  if (row?.stripe_customer_id) return row.stripe_customer_id;
  const customer = await stripe.customers.create({ email, metadata: { userId } });
  await dbOne("UPDATE account_users SET stripe_customer_id = $2 WHERE id = $1", [userId, customer.id]);
  return customer.id;
}

export async function startMembershipCheckout(input: { userId: string; email: string; planId: PlanId; origin: string }) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payments are not switched on.");
  const customer = await customerIdFor(input.userId, input.email);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    locale: "en-GB",
    customer,
    client_reference_id: input.userId,
    line_items: [{ price: await priceIdFor(input.planId), quantity: 1 }],
    success_url: `${input.origin}/account/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/account/`,
    metadata: { userId: input.userId, planId: input.planId, kind: "membership" },
    subscription_data: { metadata: { userId: input.userId, planId: input.planId } },
  });
  return checkoutUrl(session.url);
}

export async function startJourneyCheckout(input: {
  userId: string;
  email: string;
  bookingId: string;
  origin: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payments are not switched on.");
  const row = await dbOne<{
    id: string;
    customer_id: string;
    status: string;
    amount_pence: number | null;
    pickup: string;
    destination: string;
    hold_until: string | null;
    checkout_id: string | null;
  }>("SELECT id, customer_id, status, amount_pence, pickup, destination, hold_until, checkout_id FROM journey_bookings WHERE id = $1", [input.bookingId]);
  if (!row || row.customer_id !== input.userId) throw new Error("That journey could not be found.");
  if (row.status === "confirmed") return `${input.origin}/account/`;
  if (row.status !== "awaiting_payment" || !row.amount_pence || row.amount_pence <= 0) {
    throw new Error("This journey is not waiting for payment.");
  }
  if (!row.hold_until || new Date(row.hold_until).getTime() < Date.now() + 30 * 60 * 1000) {
    throw new Error("The payment window has closed. Please ask for the journey to be approved again.");
  }
  if (row.checkout_id) {
    const existing = await stripe.checkout.sessions.retrieve(row.checkout_id);
    if (existing.status === "open" && existing.url) return checkoutUrl(existing.url);
  }
  const customer = await customerIdFor(input.userId, input.email);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "en-GB",
    customer,
    client_reference_id: row.id,
    expires_at: Math.floor(new Date(row.hold_until).getTime() / 1000),
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: row.amount_pence,
        product_data: { name: `${row.pickup} to ${row.destination}` },
      },
    }],
    success_url: `${input.origin}/account/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/account/`,
    metadata: { userId: input.userId, bookingId: row.id, kind: "journey" },
  });
  await dbOne("UPDATE journey_bookings SET checkout_id = $2 WHERE id = $1", [row.id, session.id]);
  return checkoutUrl(session.url);
}

export async function openBillingPortal(userId: string, origin: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payments are not switched on.");
  const row = await dbOne<{ stripe_customer_id: string | null }>("SELECT stripe_customer_id FROM account_users WHERE id = $1", [userId]);
  if (!row?.stripe_customer_id) throw new Error("There is no billing account yet.");
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${origin}/account/`,
  });
  if (!session.url.startsWith("https://billing.stripe.com/")) throw new Error("Stripe did not return a billing page.");
  return session.url;
}

export async function syncMembership(userId: string) {
  const stripe = getStripe();
  if (!stripe) return;
  const row = await dbOne<{ stripe_customer_id: string | null }>("SELECT stripe_customer_id FROM account_users WHERE id = $1", [userId]);
  if (!row?.stripe_customer_id) return;
  const listed = await stripe.subscriptions.list({ customer: row.stripe_customer_id, status: "all", limit: 20 });
  const subscription = listed.data.find((item) => planFromSubscription(item) && !["canceled", "incomplete_expired"].includes(item.status));
  if (!subscription) {
    await dbOne("UPDATE account_users SET subscription_status = $2 WHERE id = $1", [userId, "canceled"]);
    return;
  }
  const planId = planFromSubscription(subscription);
  await dbOne(
    "UPDATE account_users SET stripe_customer_id = $2, stripe_subscription_id = $3, subscription_status = $4 WHERE id = $1",
    [userId, row.stripe_customer_id, subscription.id, subscription.status],
  );
  const period = periodOf(subscription);
  if (!planId || !liveStatuses.has(subscription.status) || !period || period.end <= new Date()) return;
  const inserted = await dbOne<{ id: string }>(
    `INSERT INTO hire_allowances (id, user_id, subscription_id, period_start, period_end, granted, plan)
     VALUES ($1, $2, $3, $4, $5, 5, $6)
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [`${subscription.id}:${period.start.getTime()}`, userId, subscription.id, period.start.toISOString(), period.end.toISOString(), planId],
  );
  if (inserted) {
    await dbOne(
      "INSERT INTO account_notifications (id, user_id, message) VALUES ($1, $2, $3)",
      [randomUUID(), userId, "Your membership is active, with five hires for this period. Unused hires do not roll over."],
    );
  }
}

export async function fulfillCheckoutSession(sessionId: string, userId: string) {
  const stripe = getStripe();
  if (!stripe || !sessionId.startsWith("cs_")) return;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userId !== userId || session.status !== "complete") return;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  if (customerId) await dbOne("UPDATE account_users SET stripe_customer_id = $2 WHERE id = $1", [userId, customerId]);
  if (session.mode === "subscription") {
    await syncMembership(userId);
    return;
  }
  if (session.mode !== "payment" || session.payment_status !== "paid") return;
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;
  const row = await dbOne<{ amount_pence: number | null; status: string }>(
    "SELECT amount_pence, status FROM journey_bookings WHERE id = $1 AND customer_id = $2",
    [bookingId, userId],
  );
  if (!row || session.currency !== "gbp" || session.amount_total !== row.amount_pence) return;
  if (row.status === "confirmed") return;
  const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  await dbOne(
    `UPDATE journey_bookings
     SET status = 'confirmed', payment_status = 'paid', payment_intent_id = $2, checkout_id = $3, hold_until = NULL
     WHERE id = $1 AND customer_id = $4 AND status = 'awaiting_payment'`,
    [bookingId, intent, session.id, userId],
  );
}
