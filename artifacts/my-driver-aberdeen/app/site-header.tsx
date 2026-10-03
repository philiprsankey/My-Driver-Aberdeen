"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import AccountLink from "./auth/account-link";

export default function SiteHeader({ solid = false, base = "", signedIn = false }: { solid?: boolean; base?: string; signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(solid);

  useEffect(() => {
    const updateScrolled = () => setScrolled(solid || window.scrollY > 16);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, [solid]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a className="brand" href={base || "#top"} aria-label="My Driver Aberdeen home">
        <Image src="/images/my-driver-aberdeen-logo.svg" alt="My Driver Aberdeen" width={1536} height={1024} priority />
      </a>
      <nav className="nav-links" aria-label="Main navigation">
        <a href={`${base}#fares`}>Fares</a><a href={`${base}#membership`}>Membership</a><a href={`${base}#journeys`}>Our journeys</a>
        <AccountLink signedIn={signedIn}>{signedIn ? "Account" : "Sign in"}</AccountLink>
        <AccountLink signedIn={signedIn} className="nav-cta" accountPath="/account/#book">Book a journey</AccountLink>
      </nav>
    </header>
  );
}