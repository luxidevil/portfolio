import { useEffect, useRef, useState } from "react";

/**
 * Reveals an element the first time it reaches the viewport, and keeps it
 * revealed.
 *
 * This uses an explicit rect check rather than IntersectionObserver because an
 * intersection-ratio trigger has two failure modes that both leave content
 * permanently invisible:
 *   - a block taller than the viewport may never satisfy a ratio threshold, and
 *   - a single-frame jump (anchor link, scroll restoration, End/Home key) can
 *     take an element from below the viewport to above it without ever
 *     producing an intersecting frame, so the observer never fires.
 *
 * Checking `rect.top` catches both: an element reveals once it has reached the
 * viewport OR has been scrolled past. The check runs once on mount — which
 * covers above-the-fold content and restored scroll positions — and is
 * rAF-throttled on scroll. Listeners remove themselves as soon as the element
 * is revealed, so a fully-scrolled page ends up with none attached.
 *
 * Passing `enabled: false` reveals immediately and attaches nothing. That is
 * the reduced-motion path: there is no entrance animation to trigger, so the
 * content should simply be present.
 */
export function useRevealOnScroll<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    let frame = 0;
    let done = false;

    function cleanup() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }

    function check() {
      frame = 0;
      if (done || !el || !el.isConnected) return;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
        done = true;
        cleanup();
        setRevealed(true);
      }
    }

    function onScroll() {
      if (frame || done) return;
      frame = requestAnimationFrame(check);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    check();

    return cleanup;
  }, [enabled]);

  return { ref, revealed };
}
