import Image from "next/image";
import { site, smsHref, telHref } from "@/lib/site";

export function Hero() {
  return (
    <section className="overflow-x-hidden border-b border-line" aria-labelledby="hero-heading">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-16">
        <div className="min-w-0">
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
          <p className="mt-6 max-w-[19rem] text-lg leading-relaxed text-balance text-muted sm:max-w-md">
            A premium, private car service for Aberdeen. Travel in style, with
            professional, reliable drivers.
          </p>
          <p className="mt-5 max-w-full text-xs tracking-[0.16em] text-gold uppercase sm:tracking-[0.22em]">
            Limited membership
            <span className="mt-1 block sm:mt-0 sm:inline">
              <span className="hidden sm:inline"> · </span>
              Exclusive places available
            </span>
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={telHref()}
              className="inline-flex min-h-12 items-center justify-center bg-gold px-6 text-sm font-medium uppercase tracking-[0.16em] text-black transition hover:bg-gold-bright"
            >
              Call {site.phoneDisplay}
            </a>
            <a
              href={smsHref()}
              className="inline-flex min-h-12 items-center justify-center border border-line px-6 text-sm font-medium uppercase tracking-[0.16em] text-ivory transition hover:border-gold hover:text-gold-bright"
            >
              Text to join
            </a>
          </div>
        </div>

        <figure className="min-w-0">
          <div className="relative bg-gold p-px">
            <div className="relative aspect-[1672/941] bg-black">
              <Image
                src="/brand/hero.jpg"
                alt="Two professional drivers with a dark Audi and a black Range Rover outside Marischal College in Aberdeen."
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          <figcaption className="mt-3 text-xs tracking-[0.18em] text-muted uppercase">
            Marischal College, Aberdeen
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
