import { MailIcon, PhoneIcon } from "@/components/icons";
import { site, telHref } from "@/lib/site";

const footerLinks = [
  "Business",
  "Airports",
  "Dinners",
  "Events",
  "Everyday travel",
];

export function Footer() {
  return (
    <footer className="border-t border-line pb-20 md:pb-0">
      <div className="border-b border-line">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-5 py-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
          <p className="text-xs tracking-[0.22em] text-ivory uppercase">
            Call or text to book
          </p>
          <a
            href={telHref()}
            className="inline-flex items-center gap-3 font-display text-4xl tracking-wide text-gold sm:text-5xl"
          >
            <PhoneIcon className="h-8 w-8 shrink-0 max-md:-ml-[7.8px] md:ml-0 md:h-9 md:w-9" />
            <span className="whitespace-nowrap">{site.phoneDisplay}</span>
          </a>
          <p className="md:text-right">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-3 text-sm tracking-wide text-gold transition hover:text-gold-bright md:text-base"
            >
              <MailIcon className="h-5 w-5 shrink-0" />
              <span>{site.email}</span>
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted">
          {site.name}. {site.tagline}.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs tracking-[0.16em] text-muted uppercase">
          {footerLinks.map((label) => (
            <li key={label}>
              <a href="#journeys" className="transition hover:text-gold-bright">
                {label}
              </a>
            </li>
          ))}
          <li className="text-gold">{site.city}</li>
        </ul>
      </div>
    </footer>
  );
}
