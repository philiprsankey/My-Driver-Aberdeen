import {
  BriefcaseIcon,
  CarIcon,
  DiningIcon,
  PinIcon,
  PlaneIcon,
} from "@/components/icons";
import { journeys } from "@/lib/site";

const icons = [PinIcon, BriefcaseIcon, PlaneIcon, DiningIcon, CarIcon];

export function Journeys() {
  return (
    <section id="journeys" className="scroll-mt-36 border-b border-line" aria-labelledby="journeys-heading">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <p className="text-xs tracking-[0.28em] text-gold uppercase">Journeys</p>
        <h2
          id="journeys-heading"
          className="mt-3 text-balance font-display text-4xl leading-none tracking-[-0.02em] text-ivory uppercase sm:text-5xl lg:text-6xl"
        >
          Where we take you
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {journeys.map((journey, index) => {
            const Icon = icons[index];
            const span = index < 3 ? "lg:col-span-2" : "lg:col-span-3";
            return (
              <li key={journey.title} className={`border border-line bg-panel px-5 py-6 ${span}`}>
                <Icon className="h-6 w-6 text-gold" />
                <h3 className="mt-5 font-display text-3xl text-ivory">{journey.title}</h3>
                <p className="mt-2 max-w-md leading-relaxed text-muted">{journey.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
