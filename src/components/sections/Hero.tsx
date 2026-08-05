import { DotAvatar } from "@/components/dot-avatar";
import { FadeIn } from "@/components/fade-in";
import { profile, asset } from "@/content/portfolio-data";
import { ArrowRight, FileText, Github, Linkedin, Mail, Twitter } from "lucide-react";

export function Hero() {
  const badge = profile.availableForWork ? (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium tracking-tight">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      Available for work
    </div>
  ) : null;

  return (
    <section className="relative pt-12 md:pt-20">
      <FadeIn delay={0.1}>
        <div className="flex flex-col-reverse md:flex-row md:items-end justify-between gap-8 md:gap-12 mb-12">
          <div className="space-y-4">
            {/* Desktop keeps the badge above the headline. On mobile it moves
                down next to the portrait so the avatar is not stranded alone in
                the corner above an empty gap. */}
            <div className="hidden md:flex items-center gap-3 mb-6">{badge}</div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-display leading-[1.1] tracking-tight">
              {profile.headline.split(' ').map((word, i) => (
                word.toLowerCase() === "production" ? 
                  <span key={i} className="text-primary italic pr-2">{word} </span> : 
                  <span key={i}>{word} </span>
              ))}
            </h1>
          </div>
          
          {/* The portrait is the first thing anyone sees, and a dot-matrix bust
              needs cells to read as a person — hair, jaw and brow all vanish if
              the grid is too coarse. 144px on mobile, 176px from md up. */}
          <div className="shrink-0 flex items-center gap-4 md:block">
            {profile.avatarUrl ? (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border border-border glow-border bg-card">
                <img
                  src={asset(profile.avatarUrl)}
                  alt={profile.name}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            ) : (
              /* No photo set, so the slot gets a dot-matrix portrait instead of
                 dead initials. DotAvatar has no frame or fill of its own — it
                 fades out into the page — so this slot is only a size. */
              <DotAvatar label={profile.name} className="w-52 h-52 md:w-64 md:h-64" />
            )}
            <div className="md:hidden">{badge}</div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.2} className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        <div className="md:col-span-8 space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
          {profile.bio.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
        
        <div className="md:col-span-4 flex flex-col items-start gap-4 pt-2">
          <div className="text-sm font-mono text-foreground font-semibold uppercase tracking-wider mb-2">
            Identity
          </div>
          <div className="flex flex-col gap-3 w-full">
            <a href={`mailto:${profile.email}`} className="group flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-border/50 pb-2">
              <span className="flex items-center gap-2 min-w-0"><Mail className="w-4 h-4 shrink-0" /> <span className="truncate">{profile.email}</span></span>
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </a>
            
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-border/50 pb-2">
                <span className="flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </a>
            )}
            
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-border/50 pb-2">
                <span className="flex items-center gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </a>
            )}
            
            {profile.twitterUrl && (
              <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-border/50 pb-2">
                <span className="flex items-center gap-2"><Twitter className="w-4 h-4" /> Twitter</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </a>
            )}
            
            {profile.resumeUrl && (
              <a href={asset(profile.resumeUrl)} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-3 rounded-lg mt-4 shadow-sm">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Download Resume</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}