import { FadeIn } from "@/components/fade-in";
import { pillars } from "@/content/portfolio-data";
import { Code2, Server, Terminal } from "lucide-react";

export function Pillars() {
  const icons = [Code2, Server, Terminal];
  
  return (
    <section className="space-y-12">
      <FadeIn>
        <h2 className="text-3xl md:text-4xl font-display font-bold">What I Do</h2>
      </FadeIn>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((pillar, idx) => {
          const Icon = icons[idx % icons.length];
          return (
            <FadeIn key={idx} delay={idx * 0.15}>
              <div className="h-full p-8 rounded-2xl bg-card border border-border glow-border group hover:border-primary/30 transition-colors duration-500">
                <div className="mb-6 inline-flex p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500 ease-out">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {pillar.body}
                </p>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}