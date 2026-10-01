import Stripe from "stripe";
import { cookies } from "next/headers";
import { dbOne } from "@/lib/db";
import { planById, site, type PlanId } from "@/lib/site";

const planCookie = "mda_plan";
const globalForStripe = globalThis as unknown as { stripe?: Stripe };

const activeStatuses = new Set(["active", "trialing", "past_due"]);

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  globalForStripe.stripe ??= new Stripe(key);
  return globalForStripe.stripe;
}

export function isPlanId(id: string): id is PlanId {
  return planById(id) !== null;
}

export function membershipIsCurrent(status: string | null) {
  return status !== null && activeStatuses.has(status);
}

export async function rememberPlanChoice(planId: PlanId) {
  (await cookies()).set(planCookie, planId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  });
}

export async function takePlanChoice() {
  const value = (await cookies()).get(planCookie)?.value;
  if (!value || !isPlanId(value)) return null;
  return value;
}

export async function clearPlanChoice() {
  (await cookies()).delete(planCookie);
}

function lookupKey(planId: PlanId) {
  return `mda-${planId}-monthly`;
}

function planFromLookup(key: string | null) {
  if (key === lookupKey("member")) return "member" as const;
  if (key === lookupKey("priority")) return "priority" as const;
  return null;
}

async function priceIdFor(planId: PlanId) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Missing STRIPE_SECRET_KEY");
  const plan = planById(planId);
  if (!plan) throw new Error("Unknown membership");
  const key = lookupKey(planId);
  const existing = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;

  const created = await stripe.prices.create({
    lookup_key: key,
    currency: "gbp",
    unit_amount: plan.price * 100,
    recurring: { interval: "month" },
    product_data: {
      name: `${plan.name} — My Driver Aberdeen`,
      metadata: { planId },
    },
  });
  return created.id;
}

export async function saveMembership(input: {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  planId: string | null;
  status: string;
}) {
  await dbOne(
    `UPDATE users
     SET stripe_customer_id = COALESCE($1, stripe_customer_id),
         stripe_subscription_id = $2,
         plan = $3,
         subscription_status = $4
     WHERE id = $5`,
    [input.customerId, input.subscriptionId, input.planId, input.status, input.userId],
  );
}

function planFromSubscription(subscription: Stripe.Subscription) {
  const price = subscription.items.data[0]?.price;
  return planFromLookup(price?.lookup_key ?? null) ?? (isPlanId(subscription.metadata.planId ?? "") ? subscription.metadata.planId : null);
}

export async function startCheckout(input: {
  userId: string;
  email: string;
  customerId: string | null;
  planId: PlanId;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Missing STRIPE_SECRET_KEY");
  const price = await priceIdFor(input.planId);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    locale: "en-GB",
    customer: input.customerId ?? undefined,
    customer_email: input.customerId ? undefined : input.email,
    client_reference_id: input.userId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${site.url}/account?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site.url}/#membership`,
    metadata: { userId: input.userId, planId: input.planId },
    subscription_data: {
      metadata: { userId: input.userId, planId: input.planId },
    },
  });
  if (!session.url?.startsWith("https://checkout.stripe.com/")) {
    throw new Error("Stripe did not return a checkout page");
  }
  return session.url;
}

export async function fulfillCheckoutSession(sessionId: string, expectedUserId?: string) {
  const stripe = getStripe();
  if (!stripe) return;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const userId = session.metadata?.userId;
  if (!userId || (expectedUserId && userId !== expectedUserId)) return;
  if (session.status !== "complete") return;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!subscriptionId || !customerId) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await saveMembership({
    userId,
    customerId,
    subscriptionId,
    planId: planFromSubscription(subscription),
    status: subscription.status,
  });
}

export async function applySubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) return;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  await saveMembership({
    userId,
    customerId,
    subscriptionId: subscription.id,
    planId: planFromSubscription(subscription),
    status: subscription.status,
  });
}

export async function openCustomerPortal(customerId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Missing STRIPE_SECRET_KEY");
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${site.url}/account`,
  });
  if (!session.url.startsWith("https://billing.stripe.com/")) {
    throw new Error("Stripe did not return a billing page");
  }
  return session.url;
}
