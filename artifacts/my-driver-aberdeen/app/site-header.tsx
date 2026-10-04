"use client";

import Image from "next/image";
import { useEffect, useState, type MouseEvent } from "react";
import AccountLink from "./auth/account-link";

export default function SiteHeader({ solid = false, base = "", signedIn = false }: { solid?: boolean; base?: string; signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(solid);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(solid || window.scrollY > 16);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, [solid]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 760) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  const followLink = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest("a");
    if (!link) return;
    const href = link.getAttribute("href") ?? "";
    const hashAt = href.indexOf("#");
    const id = hashAt >= 0 ? href.slice(hashAt + 1) : "";
    const target = id ? document.getElementById(id) : null;
    const menuWasOpen = open;
    setOpen(false);
    if (!menuWasOpen || !target) return;
    event.preventDefault();
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    }, 40);
  };

  return (
    <header className={`site-header${scrolled || open ? " is-scrolled" : ""}${open ? " is-menu" : ""}`}>
      <a className="brand" href={base || "#top"} aria-label="My Driver Aberdeen home" onClick={followLink}>
        <Image src="/images/my-driver-aberdeen-logo.svg" alt="My Driver Aberdeen" width={1536} height={1024} priority />
      </a>
      <button type="button" className="nav-menu" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((current) => !current)}>
        <span className="nav-menu-mark" aria-hidden="true"><span /><span /><span /></span>
        {open ? "Close" : "Menu"}
      </button>
      {open ? <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={close} /> : null}
      <nav id="site-menu" className={`nav-links${open ? " is-open" : ""}`} aria-label="Main navigation" onClick={followLink}>
        <a href={`${base}#fares`}>Fares</a>
        <a href={`${base}#membership`}>Membership</a>
        <a href={`${base}#journeys`}>Our journeys</a>
        <AccountLink signedIn={signedIn}>{signedIn ? "Account" : "Sign in"}</AccountLink>
        <AccountLink signedIn={signedIn} className="nav-cta" accountPath="/account/#book">Book a journey</AccountLink>
      </nav>
    </header>
  );
}