import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import {
  clearPlanChoice,
  getStripe,
  isPlanId,
  membershipIsCurrent,
  rememberPlanChoice,
  startCheckout,
} from "@/lib/billing";

export async function GET(_request: Request, context: { params: Promise<{ plan: string }> }) {
  const { plan: planId } = await context.params;
  if (!isPlanId(planId)) redirect("/#membership");

  const member = await getCurrentMember();
  if (!member) {
    await rememberPlanChoice(planId);
    redirect(`/sign-up?plan=${planId}`);
  }

  if (membershipIsCurrent(member.subscriptionStatus)) {
    await clearPlanChoice();
    redirect(member.plan === planId ? "/account" : "/account?change=1");
  }

  if (!getStripe()) {
    await clearPlanChoice();
    redirect("/account?billing=unavailable");
  }

  await clearPlanChoice();
  let url = "";
  try {
    url = await startCheckout({
      userId: member.id,
      email: member.email,
      customerId: member.stripeCustomerId,
      planId,
    });
  } catch (error) {
    console.error("Stripe checkout failed", error instanceof Error ? error.message : "");
    redirect("/account?billing=failed");
  }
  redirect(url);
}
