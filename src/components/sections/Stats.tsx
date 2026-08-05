import { CountUp } from "@/components/count-up";
import { FadeIn } from "@/components/fade-in";
import { stats } from "@/content/portfolio-data";

export function Stats() {
  return (
    <section>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-y border-border py-12">
        {stats.map((stat, idx) => (
          <FadeIn key={idx} delay={idx * 0.1} direction="up" className="flex flex-col gap-2">
            <div className="text-4xl md:text-6xl font-mono font-bold tracking-tighter">
              <CountUp
                value={stat.value}
                className={"accent" in stat && stat.accent ? "text-primary" : "text-foreground"}
              />
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}