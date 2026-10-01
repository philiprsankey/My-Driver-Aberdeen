"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { site, telHref } from "@/lib/site";

const links = [
  { href: "/#service", label: "The service" },
  { href: "/#journeys", label: "Journeys" },
  { href: "/#membership", label: "Membership" },
  { href: "/#questions", label: "Questions" },
];

export function HeaderBar({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const accountHref = signedIn ? "/account" : "/sign-in";
  const accountLabel = signedIn ? "Account" : "Sign in";

  function onLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    setOpen(false);
    if (pathname !== "/") return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    if (window.location.hash) {
      window.history.replaceState(null, "", "/");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-black/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2">
        <Link href="/" onClick={onLogoClick} className="-ml-3 shrink-0 sm:ml-0">
          <Image
            src="/brand/my_driver_aberdeen_master.svg"
            alt="My Driver Aberdeen, private members' car service"
            width={1536}
            height={1024}
            unoptimized
            priority
            className="h-24 w-auto sm:h-32"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Page">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-[0.2em] text-muted transition hover:text-gold-bright"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={accountHref}
            className="text-xs uppercase tracking-[0.2em] text-ivory transition hover:text-gold-bright"
          >
            {accountLabel}
          </Link>
        </nav>

        <a
          href={telHref()}
          className="hidden min-h-11 items-center bg-gold px-4 text-xs font-medium uppercase tracking-[0.16em] text-black transition hover:bg-gold-bright lg:inline-flex"
        >
          {site.phoneDisplay}
        </a>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center border border-line text-gold lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="flex w-4 flex-col gap-1.5">
            <span className="block h-px bg-current" />
            <span className="block h-px bg-current" />
            <span className="block h-px bg-current" />
          </span>
        </button>
      </div>

      {open ? (
        <nav id="mobile-nav" className="border-t border-line px-5 py-4 lg:hidden" aria-label="Page">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block py-3 font-display text-3xl uppercase text-ivory"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href={accountHref}
                className="block py-3 font-display text-3xl uppercase text-gold"
                onClick={() => setOpen(false)}
              >
                {accountLabel}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
