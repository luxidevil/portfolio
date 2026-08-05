import { useEffect } from "react";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Pillars } from "@/components/sections/Pillars";
import { Experience } from "@/components/sections/Experience";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { ArchiveProjects } from "@/components/sections/ArchiveProjects";
import { Skills } from "@/components/sections/Skills";
import { Education } from "@/components/sections/Education";
import { Footer } from "@/components/sections/Footer";
import { SiteNav } from "@/components/site-nav";
import { GameHud } from "@/components/game-hud";
import { profile, asset } from "@/content/portfolio-data";

/**
 * Makes deep links like /#experience actually work, and /#resume mean something.
 *
 * Two problems are being solved here:
 *
 * 1. The browser honours a #hash by looking for the element as the document
 *    parses. This is a single-page app, so at that moment the document is just
 *    <div id="root"> — the section does not exist yet, the browser finds
 *    nothing, and the page stays at the top. It never retries once React
 *    renders. So the scroll has to be performed manually after mount.
 *
 * 2. `#resume` has no section to scroll to at all — the resume is a file, not
 *    part of the page. Anyone opening or sharing /#resume wants the PDF, so
 *    send them to it rather than leaving them at the top with nothing happening.
 */
function useHashNavigation() {
  useEffect(() => {
    const go = (smooth: boolean) => {
      const hash = window.location.hash;
      if (!hash) return;

      if (hash === "#resume" && profile.resumeUrl) {
        window.location.replace(asset(profile.resumeUrl));
        return;
      }

      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      }
    };

    // Wait two frames before the initial jump: the sections mount with a fade/
    // translate animation, so measuring on the first frame lands at the wrong
    // offset. Jump instantly rather than smoothly on arrival — a page that
    // animates a long scroll on load looks broken.
    // Both frame ids are retained: cancelling only the outer one would let an
    // already-scheduled inner callback fire after unmount.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => go(false));
    });

    const onHashChange = () => go(true);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);
}

/**
 * Section anchors, so a link can point at one part of the page — e.g. sending a
 * recruiter straight to /#experience. `scroll-mt-24` stops the heading from
 * being jammed against the top of the viewport on arrival.
 *
 * These wrappers are direct children of <main>, which is what its `space-y-*`
 * spacing applies to — keep them direct children or the section rhythm breaks.
 */
function Anchor({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24">
      {children}
    </div>
  );
}

export default function Home() {
  useHashNavigation();

  return (
    <>
      {/* The theme toggle lives inside SiteNav now — a sticky header and a
          separately-pinned toggle would overlap and fight for the top-right. */}
      <SiteNav />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 md:py-24 space-y-32 md:space-y-48">
        <Anchor id="about"><Hero /></Anchor>
        <Anchor id="impact"><Stats /></Anchor>
        <Anchor id="what-i-do"><Pillars /></Anchor>
        <Anchor id="experience"><Experience /></Anchor>
        <Anchor id="projects"><FeaturedProjects /></Anchor>
        <Anchor id="skills"><Skills /></Anchor>
        <Anchor id="archive"><ArchiveProjects /></Anchor>
        <Anchor id="education"><Education /></Anchor>
        <Footer />
      </main>
      {/* Reads the anchors above straight from the DOM, so it stays in sync
          with whatever sections exist. */}
      <GameHud />
    </>
  );
}
