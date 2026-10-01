import {
  DiamondIcon,
  DriverIcon,
  PhoneIcon,
  ShieldIcon,
} from "@/components/icons";
import { standards } from "@/lib/site";

const icons = [DiamondIcon, DriverIcon, ShieldIcon, PhoneIcon];

export function Service() {
  return (
    <section id="service" className="scroll-mt-36 border-b border-line" aria-labelledby="service-heading">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-5 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:py-24">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.28em] text-gold uppercase">The service</p>
          <h2
            id="service-heading"
            className="mt-3 max-w-xl text-balance font-display text-4xl leading-[0.95] tracking-[-0.02em] text-ivory uppercase sm:text-5xl lg:text-6xl"
          >
            Private car hire in Aberdeen
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            My Driver Aberdeen is a private members&apos; car service for people
            who want a luxury car and a professional driver in the city.
            Membership covers up to five hires a month inside Aberdeen and a
            10-mile service area.
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            Use it for business, Aberdeen Airport, dinners, events, and everyday
            travel. Places are limited, and every hire is arranged directly by
            phone or text.
          </p>
        </div>

        <ul className="grid min-w-0 gap-px bg-line sm:grid-cols-2">
          {standards.map((item, index) => {
            const Icon = icons[index];
            return (
              <li key={item.title} className="bg-black px-5 py-6">
                <Icon className="h-6 w-6 text-gold" />
                <h3 className="mt-4 font-display text-2xl text-ivory">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
