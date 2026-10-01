import { CheckIcon } from "@/components/icons";
import { plans, smsHref, telHref } from "@/lib/site";

export function Membership() {
  return (
    <section
      id="membership"
      className="scroll-mt-36 border-b border-line"
      aria-labelledby="membership-heading"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <p className="text-xs tracking-[0.28em] text-gold uppercase">Membership</p>
        <h2
          id="membership-heading"
          className="mt-3 max-w-3xl text-balance font-display text-4xl leading-[0.95] tracking-[-0.02em] text-ivory uppercase sm:text-5xl lg:text-6xl"
        >
          Two ways to be driven
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Both memberships include up to five hires a month within Aberdeen and
          the 10-mile service area. Further hires are charged at member rates.
          Exclusive places are available.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={
                plan.featured
                  ? "border border-gold bg-panel px-6 py-7 sm:px-8"
                  : "border border-line bg-black px-6 py-7 sm:px-8"
              }
            >
              <div className="flex items-end justify-between gap-4 border-b border-line pb-5">
                <h3 className="font-display text-3xl tracking-[0.08em] text-gold uppercase">
                  {plan.name}
                </h3>
                <p className="text-right text-ivory">
                  <span className="font-display text-5xl leading-none text-gold">
                    £{plan.price}
                  </span>
                  <span className="ml-1 text-sm tracking-[0.14em] text-muted uppercase">
                    / month
                  </span>
                </p>
              </div>
              <p className="mt-5 text-center font-display text-2xl text-ivory">
                {plan.summary}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.includes.map((item) => (
                  <li key={item} className="flex gap-3 text-muted">
                    <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3">
                <a
                  href={`/join/${plan.id}`}
                  className="inline-flex min-h-12 items-center justify-center bg-gold px-5 text-sm font-medium tracking-[0.16em] text-black uppercase transition hover:bg-gold-bright"
                >
                  Join online
                </a>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={telHref()}
                    className="inline-flex min-h-12 flex-1 items-center justify-center border border-line px-5 text-sm font-medium tracking-[0.16em] text-ivory uppercase transition hover:border-gold hover:text-gold-bright"
                  >
                    Call to join
                  </a>
                  <a
                    href={smsHref(plan.name)}
                    className="inline-flex min-h-12 flex-1 items-center justify-center border border-line px-5 text-sm font-medium tracking-[0.16em] text-ivory uppercase transition hover:border-gold hover:text-gold-bright"
                  >
                    Text to join
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
