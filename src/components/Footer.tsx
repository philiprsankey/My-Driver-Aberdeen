import { site, smsHref, telHref } from "@/lib/site";

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
            className="font-display text-4xl tracking-wide text-gold sm:text-5xl"
          >
            {site.phoneDisplay}
          </a>
          <p className="md:text-right">
            <a
              href={`mailto:${site.email}`}
              className="text-sm tracking-wide text-gold transition hover:text-gold-bright md:text-base"
            >
              {site.email}
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

export function JoinBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-black md:hidden">
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
