import { FadeIn } from "@/components/fade-in";
import { projects } from "@/content/portfolio-data";
import { ExternalLink, Github } from "lucide-react";

export function FeaturedProjects() {
  const featuredProjects = projects.filter(p => p.featured);

  return (
    <section className="space-y-12">
      <FadeIn>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-4xl font-display font-bold">Featured Systems</h2>
          <p className="text-muted-foreground">Production platforms, heavily engineered tools, and core projects.</p>
        </div>
      </FadeIn>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {featuredProjects.map((project, idx) => (
          <FadeIn key={project.slug} delay={idx * 0.1}>
            <div className="group h-full flex flex-col p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:via-primary/50 transition-all duration-700"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-display font-bold">{project.name}</h3>
                  {project.liveUrl && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-muted-foreground">
                  {project.repo && (
                    <a href={project.repo} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors z-10" aria-label={`GitHub repo for ${project.name}`}>
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors z-10" aria-label={`Live site for ${project.name}`}>
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
              
              <p className="text-primary font-mono text-sm mb-4">{project.tagline}</p>
              
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-auto">
                <span className="px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium border border-border/50">
                  {project.category}
                </span>
                {project.stack.slice(0, 3).map(tech => (
                  <span key={tech} className="px-2.5 py-1 rounded-md bg-background text-muted-foreground text-xs font-mono border border-border/50">
                    {tech}
                  </span>
                ))}
                {project.stack.length > 3 && (
                  <span className="px-2.5 py-1 rounded-md bg-background text-muted-foreground text-xs font-mono border border-border/50">
                    +{project.stack.length - 3}
                  </span>
                )}
              </div>
              
              {project.scale && (
                <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8 opacity-10 md:opacity-5 md:group-hover:opacity-10 transition-opacity pointer-events-none">
                  <span className="font-display font-bold text-4xl tracking-tighter whitespace-nowrap">
                    {project.scale}
                  </span>
                </div>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}