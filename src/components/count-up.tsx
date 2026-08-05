import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useRevealOnScroll } from "@/lib/use-reveal";

/**
 * Counts a headline number up from zero the first time it scrolls into view.
 *
 * The stats on this page are strings rather than numbers — "50k+", "46%", "4+".
 * So the string is split into a numeric core and whatever wraps it; only the
 * core animates and the prefix/suffix are re-attached each frame. A value with
 * no digits at all is rendered untouched rather than being mangled into "0".
 *
 * The figures are the strongest evidence on the page, so they are worth drawing
 * the eye to — but only once, and only when the reader has actually arrived at
 * them.
 */
const PARTS = /^(\D*?)(\d+(?:\.\d+)?)(.*)$/;

const DURATION_MS = 1100;

export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  // Parsed once per value: the match array is a fresh object every render, so
  // it must never be used as an effect dependency.
  const parsed = useMemo(() => {
    const m = value.match(PARTS);
    if (!m) return null;
    const digits = m[2];
    return {
      prefix: m[1],
      suffix: m[3],
      target: parseFloat(digits),
      decimals: digits.includes(".") ? digits.split(".")[1].length : 0,
    };
  }, [value]);

  const animatable = !prefersReducedMotion && parsed !== null;
  const { ref, revealed } = useRevealOnScroll<HTMLSpanElement>(animatable);
  const [shown, setShown] = useState(0);

  const target = parsed?.target ?? 0;

  useEffect(() => {
    if (!animatable || !revealed) return;

    let frame = 0;
    const started = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / DURATION_MS);
      // easeOutExpo: sprints away from zero then settles, which reads as a
      // counter landing on a figure rather than a linear slider.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setShown(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animatable, revealed, target]);

  if (!parsed) return <span className={className}>{value}</span>;

  const n = animatable ? shown : target;

  return (
    // Tabular figures stop the number's width from jittering as it counts.
    <span ref={ref} className={`tabular-nums ${className}`}>
      {parsed.prefix}
      {n.toFixed(parsed.decimals)}
      {parsed.suffix}
    </span>
  );
}
