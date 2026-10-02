import {
  BuildingIcon,
  CastleIcon,
  LighthouseIcon,
  PlaneIcon,
  ShipIcon,
  TowerIcon,
  TreeIcon,
} from "@/components/icons";
import { fares, site, smsHref, telHref } from "@/lib/site";

const fareIcons = {
  "Aberdeen Airport": PlaneIcon,
  Banchory: TreeIcon,
  Turriff: TowerIcon,
  Peterhead: ShipIcon,
  Fraserburgh: LighthouseIcon,
  Edinburgh: CastleIcon,
  "Edinburgh Airport": PlaneIcon,
  Glasgow: BuildingIcon,
  "Glasgow Airport": PlaneIcon,
} as const;

export function Prices() {
  return (
    <section id="prices" className="scroll-mt-36 border-b border-line" aria-labelledby="prices-heading">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <p className="text-xs tracking-[0.28em] text-gold uppercase">One-off journeys</p>
        <h2
          id="prices-heading"
          className="mt-3 max-w-3xl text-balance font-display text-4xl leading-[0.95] tracking-[-0.02em] text-ivory uppercase sm:text-5xl lg:text-6xl"
        >
          Fixed prices from Aberdeen
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Book by a call or a text to {site.phoneDisplay}. A membership is not required.
        </p>
        <ul className="mt-10 grid grid-cols-1 gap-x-16 sm:grid-cols-2">
          {fares.map((fare) => {
            const Icon = fareIcons[fare.place];
            return (
              <li key={fare.place} className="flex items-center gap-4 border-b border-line py-3">
                <Icon className="h-6 w-6 shrink-0 text-gold" />
                <span className="min-w-0 flex-1 font-display text-2xl text-ivory">{fare.place}</span>
                <span className="inline-flex min-w-24 items-center justify-center bg-gold px-3 py-1.5 font-display text-2xl leading-none text-black">
                  £{fare.price}
                </span>
              </li>
            );
          })}
        </ul>
        <div data-section-actions className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={telHref()}
            className="inline-flex min-h-12 items-center justify-center bg-gold px-6 text-sm font-medium uppercase tracking-[0.16em] text-black transition hover:bg-gold-bright"
          >
            Call to book
          </a>
          <a
            href={smsHref()}
            className="inline-flex min-h-12 items-center justify-center border border-line px-6 text-sm font-medium uppercase tracking-[0.16em] text-ivory transition hover:border-gold hover:text-gold-bright"
          >
            Text to book
          </a>
        </div>
      </div>
    </section>
  );
}
