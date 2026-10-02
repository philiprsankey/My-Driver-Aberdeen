"use client";

import { useLayoutEffect, useState } from "react";
import { smsHref, telHref } from "@/lib/site";

const hiddenSections = new Set(["hero", "prices", "membership"]);

export function JoinBar() {
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const sections = ["hero", "prices", "service", "journeys", "membership", "questions"]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    const footer = document.querySelector("footer");
    const markers = footer ? [...sections, footer] : sections;
    let frame = 0;

    function actionsOnScreen() {
      const header = document.querySelector("header");
      const top = header ? header.getBoundingClientRect().bottom : 0;
      return [...document.querySelectorAll("[data-section-actions]")].some((node) => {
        const box = node.getBoundingClientRect();
        return box.bottom > top + 8 && box.top < window.innerHeight - 8;
      });
    }

    function update() {
      const mark = window.innerHeight * 0.45;
      const current = markers.find((section) => {
        const box = section.getBoundingClientRect();
        return box.top <= mark && box.bottom > mark;
      });
      const show = current !== undefined && !hiddenSections.has(current.id) && !actionsOnScreen();
      setVisible((value) => (value === show ? value : show));
    }

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      data-open={visible ? "true" : "false"}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-black transition-transform duration-200 md:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <a
        href={telHref()}
        className="inline-flex min-h-14 items-center justify-center text-sm tracking-[0.16em] text-ivory uppercase"
      >
        Call
      </a>
      <a
        href={smsHref()}
        className="inline-flex min-h-14 items-center justify-center bg-gold text-sm font-medium tracking-[0.16em] text-black uppercase"
      >
        Text to book
      </a>
    </div>
  );
}
