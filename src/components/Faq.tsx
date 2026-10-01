import { questions } from "@/lib/site";

export function Faq() {
  return (
    <section id="questions" className="scroll-mt-36" aria-labelledby="questions-heading">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-24">
        <p className="text-xs tracking-[0.28em] text-gold uppercase">Questions</p>
        <h2
          id="questions-heading"
          className="mt-3 text-balance font-display text-4xl leading-none tracking-[-0.02em] text-ivory uppercase sm:text-5xl lg:text-6xl"
        >
          Before you join
        </h2>
        <div className="mt-8 border-t border-line">
          {questions.map((item) => (
            <details key={item.question} className="group border-b border-line">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-5">
                <h3 className="font-display text-2xl leading-tight text-ivory sm:text-3xl">
                  {item.question}
                </h3>
                <span
                  aria-hidden="true"
                  className="font-display text-3xl leading-none text-gold transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-3xl pb-6 leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
