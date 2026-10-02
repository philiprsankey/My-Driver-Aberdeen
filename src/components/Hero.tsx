import Image from "next/image";
import { site, smsHref, telHref } from "@/lib/site";

export function Hero() {
  return (
    <section id="hero" className="relative isolate min-h-[calc(100svh-7rem)] overflow-hidden border-b border-line sm:min-h-[42rem]" aria-labelledby="hero-heading">
      <Image
        src="/brand/main.png"
        alt="A black Audi and a black Range Rover outside Aberdeen International Airport at sunset."
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_45%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/25" />
      <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-6xl items-center px-5 sm:min-h-[42rem] sm:py-16">
        <div className="min-w-0 max-w-xl">
          <p className="max-w-full font-script text-[2.05rem] leading-tight text-gold sm:text-5xl">
            Aberdeen in a different class
          </p>
          <h1
            id="hero-heading"
            className="mt-5 max-w-full font-display text-[clamp(2.35rem,11vw,6.25rem)] uppercase leading-[0.84] tracking-[-0.03em] text-ivory"
          >
            <span className="block">Your city.</span>
            <span className="block">Your driver.</span>
            <span className="block text-gold">Your time.</span>
          </h1>
          <p className="mt-6 max-w-[19rem] text-lg leading-relaxed text-balance text-ivory sm:max-w-md">
            A private car for a one-off journey, or a membership if you travel often.
          </p>
          <div data-section-actions className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={telHref()}
              className="inline-flex min-h-12 items-center justify-center bg-gold px-6 text-sm font-medium uppercase tracking-[0.16em] text-black transition hover:bg-gold-bright"
            >
              Call {site.phoneDisplay}
            </a>
            <a
              href={smsHref()}
              className="inline-flex min-h-12 items-center justify-center border border-ivory/40 px-6 text-sm font-medium uppercase tracking-[0.16em] text-ivory transition hover:border-gold hover:text-gold-bright"
            >
              Text to book
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
