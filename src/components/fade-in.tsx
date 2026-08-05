import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { useRevealOnScroll } from "@/lib/use-reveal";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
}

/**
 * Scroll reveal.
 *
 * The content is the point of this page; the animation is decoration. So the
 * reveal is deliberately fail-safe and must never be able to strand a block at
 * opacity 0 — see `useRevealOnScroll` for why it avoids IntersectionObserver.
 */
export function FadeIn({ children, delay = 0, className = "", direction = "up" }: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>(!prefersReducedMotion);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const directionOffsets = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { x: 24, y: 0 },
    right: { x: -24, y: 0 },
    none: { x: 0, y: 0 },
  };

  const offset = directionOffsets[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={revealed ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{
        duration: 0.5,
        // Cap the stagger so a long list never leaves late items waiting.
        delay: Math.min(delay, 0.3),
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
