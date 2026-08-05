import { FadeIn } from "@/components/fade-in";
import { projects, projectCategories, ProjectCategory } from "@/content/portfolio-data";
import { ExternalLink, Github } from "lucide-react";
import { useState } from "react";

export function ArchiveProjects() {
  const archiveProjects = projects.filter(p => !p.featured);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'All'>('All');

  const filteredProjects = activeCategory === 'All' 
    ? archiveProjects 
    : archiveProjects.filter(p => p.category === activeCategory);

  return (
    <section className="space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2">The Archive</h2>
            <p className="text-muted-foreground text-sm">Other tools, internal dashboards, and past work.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                activeCategory === 'All' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {projectCategories.map(cat => {
              // Only show category if there are non-featured projects in it
              const count = archiveProjects.filter(p => p.category === cat).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                    activeCategory === cat 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat} <span className="opacity-50 ml-1">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.map((project, idx) => (
          <FadeIn key={project.slug} delay={idx * 0.05} direction="up">
            <div className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-display font-bold truncate">{project.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground uppercase tracking-wider shrink-0">
                    {project.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{project.description}</p>
              </div>
              
              <div className="flex items-center gap-6 shrink-0">
                <div className="hidden md:flex gap-2">
                  {project.stack.slice(0, 2).map(tech => (
                    <span key={tech} className="text-xs font-mono text-muted-foreground">
                      {tech}
                    </span>
                  ))}
                  {project.stack.length > 2 && (
                    <span className="text-xs font-mono text-muted-foreground">
                      +{project.stack.length - 2}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-muted-foreground">
                  {project.repo && (
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.name} source code on GitHub`}
                      className="hover:text-primary transition-colors"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${project.name} live site`}
                      className="hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
        
        {filteredProjects.length === 0 && (
          <div className="py-12 text-center text-muted-foreground font-mono text-sm border border-dashed border-border rounded-xl">
            No projects found in this category.
          </div>
        )}
      </div>
    </section>
  );
}