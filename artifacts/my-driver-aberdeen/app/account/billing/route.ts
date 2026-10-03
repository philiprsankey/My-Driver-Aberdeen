import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { openBillingPortal } from "@/lib/billing";
import { originFrom } from "@/lib/origin";

function isNextRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) redirect("/sign-in/?next=/account/");
  try {
    redirect(await openBillingPortal(account.id, originFrom(await headers())));
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirect("/account/?notice=billing");
  }
}
