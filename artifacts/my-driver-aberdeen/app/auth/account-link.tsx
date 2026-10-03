import type { AnchorHTMLAttributes } from "react";

export default function AccountLink({
  signedIn,
  accountPath = "/account/",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { signedIn: boolean; accountPath?: string }) {
  const href = signedIn ? accountPath : `/sign-in/?next=${encodeURIComponent(accountPath)}`;
  return <a {...props} href={href} />;
}
