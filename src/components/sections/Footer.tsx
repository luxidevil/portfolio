import { profile } from "@/content/portfolio-data";

export function Footer() {
  return (
    <footer className="pt-16 pb-12 border-t border-border">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-xl font-display font-bold mb-2">{profile.name}</h2>
          <p className="text-muted-foreground text-sm font-mono">
            {profile.role} • {profile.location}
          </p>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          <a href={`mailto:${profile.email}`} className="text-muted-foreground hover:text-primary transition-colors">
            Email
          </a>
          {profile.githubUrl && (
            <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              GitHub
            </a>
          )}
          {profile.linkedinUrl && (
            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              LinkedIn
            </a>
          )}
          {profile.twitterUrl && (
            <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              Twitter
            </a>
          )}
        </div>
      </div>
      
      <div className="mt-12 text-xs text-muted-foreground font-mono flex flex-col md:flex-row justify-between gap-4">
        <p>Built with React, Vite, and Tailwind.</p>
        <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}