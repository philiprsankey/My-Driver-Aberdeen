import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { isPlanId, startMembershipCheckout } from "@/lib/billing";
import { originFrom } from "@/lib/origin";

function isNextRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

export async function GET(_request: Request, context: { params: Promise<{ plan: string }> }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/sign-in/?next=/account/");
  if (account.role !== "customer") redirect("/account/");
  const { plan } = await context.params;
  if (!isPlanId(plan)) redirect("/account/");
  try {
    const url = await startMembershipCheckout({
      userId: account.id,
      email: account.email,
      planId: plan,
      origin: originFrom(await headers()),
    });
    redirect(url);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirect("/account/?notice=pay");
  }
}
