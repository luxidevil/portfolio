import { FadeIn } from "@/components/fade-in";
import { skillGroups } from "@/content/portfolio-data";

export function Skills() {
  return (
    <section className="space-y-12">
      <FadeIn>
        <h2 className="text-3xl md:text-4xl font-display font-bold">Capabilities</h2>
      </FadeIn>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {skillGroups.map((group, idx) => (
          <FadeIn key={group.title} delay={idx * 0.1}>
            <div className="space-y-4">
              <h3 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-foreground font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                    {item}
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