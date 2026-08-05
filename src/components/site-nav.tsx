import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { profile, asset } from "@/content/portfolio-data";

/**
 * The sections worth one-tap access. Deliberately a subset of the anchors on
 * the page — "impact", "what-i-do" and "archive" are things you scroll past,
 * not destinations a recruiter asks for. Resume is NOT here as an anchor:
 * it's a file, so it gets a real download link at the end instead.
 */
const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
] as const;

/**
 * Tracks which nav section the reader is currently in.
 *
 * Uses scroll position against each section's top rather than an
 * IntersectionObserver: with sections of wildly different heights, an
 * observer either fires for several sections at once or misses short ones
 * entirely. "The last section whose top has passed the header line" is
 * unambiguous and cheap.
 */
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string>(ids[0]);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      // The header is ~56px tall and anchors carry scroll-mt-24 (96px), so a
      // section "starts" when its top crosses ~a third of the viewport — that
      // matches what the eye considers the current section while reading.
      const line = window.innerHeight / 3;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // At the very bottom the last section may be too short to ever cross
      // the line; if the page can't scroll further, it's the active one.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = ids[ids.length - 1];
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return active;
}

/**
 * Slim sticky header with section links and the theme toggle.
 *
 * Clicks go through `location.hash` so the existing `useHashNavigation` hook
 * in Home.tsx does the actual scrolling (via its `hashchange` listener) —
 * there is exactly one scrolling mechanism on the page. The only exception is
 * re-clicking the section you're already on, which cannot fire `hashchange`,
 * so it scrolls directly with the same options the hook uses.
 *
 * On mobile the link row scrolls horizontally instead of collapsing behind a
 * hamburger: the primary audience arrives from LinkedIn/WhatsApp on a phone,
 * and one tap beats tap-open-then-tap.
 */
export function SiteNav() {
  const active = useActiveSection(NAV_ITEMS.map((i) => i.id));

  const onNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    if (window.location.hash === `#${id}`) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = id;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <nav
        aria-label="Section navigation"
        className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3"
      >
        <ul className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <li key={id} className="shrink-0">
                <a
                  href={`#${id}`}
                  onClick={(e) => onNavClick(e, id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                  }`}
                >
                  {label}
                </a>
              </li>
            );
          })}
          {profile.resumeUrl && (
            <li className="shrink-0">
              <a
                href={asset(profile.resumeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-tight text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <FileText className="h-3 w-3" aria-hidden="true" />
                Resume
                <span className="sr-only">(opens PDF)</span>
              </a>
            </li>
          )}
        </ul>
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
