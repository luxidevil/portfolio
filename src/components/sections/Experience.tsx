import { FadeIn } from "@/components/fade-in";
import { experience } from "@/content/portfolio-data";

function HighlightedText({ text }: { text: string }) {
  /**
   * Highlight impact metrics only — a number that carries a magnitude signal:
   * a thousands separator ("50,000+") or a trailing % / +.
   *
   * Deliberately does NOT match bare digits. Matching every digit turned
   * "N+1 queries" into "N+1" with the 1 styled as a metric, which read as a
   * typo in the most important section on the page.
   */
  const parts = text.split(/(\d{1,3}(?:,\d{3})+\+?%?|\d+(?:\.\d+)?[%+])/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 !== 0 ? (
          <span key={i} className="text-primary font-mono font-bold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export function Experience() {
  return (
    <section className="space-y-12">
      <FadeIn>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Experience</h2>
          <p className="text-muted-foreground">Professional history and impact.</p>
        </div>
      </FadeIn>

      <div className="space-y-8">
        {experience.map((entry, idx) => (
          <FadeIn key={idx} delay={idx * 0.1}>
            <div className={`relative pl-6 md:pl-8 border-l border-border/50 ${idx !== experience.length - 1 ? "pb-12" : ""}`}>
              {/* Timeline Node */}
              <div className="absolute -left-[6.5px] top-1.5 w-3 h-3 rounded-full bg-background border-2 border-primary ring-4 ring-background" />

              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-4 -mt-1">
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-3">
                    {entry.company}
                    {entry.current && (
                      <span className="relative flex h-2 w-2" title="Current role">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        <span className="sr-only">Current role</span>
                      </span>
                    )}
                  </h3>
                  <div className="text-primary font-mono text-sm font-medium mt-1">
                    {entry.role}
                  </div>
                </div>
                <div className="text-sm font-mono text-muted-foreground flex flex-col md:items-end">
                  <span>{entry.period}</span>
                  <span className="opacity-75">{entry.location}</span>
                </div>
              </div>

              <ul className="space-y-3 mt-6">
                {entry.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="relative pl-5 text-sm md:text-base text-muted-foreground leading-relaxed">
                    <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <HighlightedText text={bullet} />
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}