import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { startJourneyCheckout } from "@/lib/billing";
import { originFrom } from "@/lib/origin";

function isNextRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/sign-in/?next=/account/");
  if (account.role !== "customer") redirect("/account/");
  const { id } = await context.params;
  try {
    const url = await startJourneyCheckout({
      userId: account.id,
      email: account.email,
      bookingId: id,
      origin: originFrom(await headers()),
    });
    redirect(url);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirect("/account/?notice=pay");
  }
}
