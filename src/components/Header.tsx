import { HeaderBar } from "@/components/HeaderBar";
import { getCurrentMember } from "@/lib/auth";

export async function Header() {
  const member = await getCurrentMember();
  return <HeaderBar signedIn={member !== null} />;
}
