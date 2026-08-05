import { FadeIn } from "@/components/fade-in";
import { education } from "@/content/portfolio-data";

export function Education() {
  return (
    <section className="space-y-8">
      <FadeIn>
        <h2 className="text-3xl font-display font-bold">Education</h2>
      </FadeIn>
      
      <FadeIn delay={0.1}>
        <div className="p-6 md:p-8 rounded-2xl bg-card border border-border glow-border">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-2">
            <h3 className="text-xl font-display font-bold">{education.degree}</h3>
            <span className="text-sm font-mono text-primary font-medium">
              {education.period}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <span className="font-medium text-foreground">{education.school}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{education.location}</span>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}