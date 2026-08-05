import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Trophy, X } from "lucide-react";

/**
 * The gamified layer: a scroll progress bar and an explorer HUD.
 *
 * The rule that keeps this from wrecking a recruiter's first impression is
 * *earned presence*. Nothing appears above the fold. The HUD only slides in
 * once someone has scrolled past the hero — by which point they've chosen to
 * read on — and it can be dismissed outright. A recruiter who wants the CV
 * gets the CV; a visitor who wants to play finds a game.
 *
 * Progress is measured in sections actually seen rather than raw scroll depth,
 * because scroll depth rewards flicking to the bottom, which is the opposite
 * of the behaviour worth rewarding.
 */

interface Achievement {
  id: string;
  label: string;
  hint: string;
  secret?: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "explorer", label: "Explorer", hint: "Read four sections" },
  { id: "completionist", label: "Completionist", hint: "See every section" },
  { id: "recruiter", label: "Recruiter Mode", hint: "Open the resume" },
  { id: "source-diver", label: "Source Diver", hint: "Open a project link" },
  { id: "konami", label: "Certified Gamer", hint: "???", secret: true },
];

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const STORE_KEY = "kg.hud.v1";

/**
 * Storage throws outright in Safari private mode and wherever site data is
 * blocked. A HUD is not worth taking the page down for, so every access
 * degrades to "nothing unlocked yet".
 */
function loadUnlocked(): string[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function saveUnlocked(ids: string[]) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — achievements just won't persist */
  }
}

/** Thin bar across the very top showing how far down the page you are. */
function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    // Above the sticky nav (z-40) so the bar is never tucked behind it.
    <div className="fixed top-0 inset-x-0 h-0.5 z-50 pointer-events-none" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 origin-left transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${pct})`, width: "100%" }}
      />
    </div>
  );
}

export function GameHud() {
  const prefersReducedMotion = useReducedMotion();

  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [total, setTotal] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<Achievement | null>(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const unlockedRef = useRef<Set<string>>(new Set());
  const toastTimer = useRef(0);

  const unlock = useCallback((id: string) => {
    if (unlockedRef.current.has(id)) return;
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) return;

    unlockedRef.current.add(id);
    const next = new Set(unlockedRef.current);
    setUnlocked(next);
    saveUnlocked([...next]);

    setToast(achievement);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  }, []);

  // Restore anything unlocked on a previous visit, without re-toasting it.
  useEffect(() => {
    const stored = loadUnlocked();
    if (stored.length) {
      unlockedRef.current = new Set(stored);
      setUnlocked(new Set(stored));
    }
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  /**
   * Sections are discovered from the DOM rather than from a hardcoded list, so
   * adding or removing an anchor in Home.tsx keeps the HUD honest automatically
   * instead of silently making "8/8" unreachable.
   *
   * The same rect check the scroll-reveal uses, and for the same reason: an
   * IntersectionObserver with a ratio threshold cannot count a section taller
   * than the viewport (its ratio never reaches the threshold), and it never
   * fires for sections a hash jump skipped clean over. Either one makes
   * Completionist permanently unreachable. "Its top has entered the viewport,
   * or is already above it" has neither hole.
   */
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("main > [id]"));
    if (!nodes.length) return;
    setTotal(nodes.length);

    // Sections drop out of `pending` once counted, so a fully-read page ends up
    // doing no work per scroll event and then detaches entirely.
    const pending = new Map(nodes.map((n) => [n.id, n] as const));
    let frame = 0;

    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    const scan = () => {
      frame = 0;
      const line = window.innerHeight * 0.8;
      const arrived: string[] = [];
      for (const [id, node] of pending) {
        if (node.getBoundingClientRect().top < line) {
          arrived.push(id);
          pending.delete(id);
        }
      }
      if (arrived.length) {
        setSeen((prev) => {
          const next = new Set(prev);
          for (const id of arrived) next.add(id);
          return next;
        });
      }
      if (!pending.size) detach();
    };

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(scan);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    scan();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      detach();
    };
  }, []);

  // Section-count milestones.
  useEffect(() => {
    if (total === 0) return;
    if (seen.size >= 4) unlock("explorer");
    if (seen.size >= total) unlock("completionist");
  }, [seen, total, unlock]);

  /**
   * Outbound clicks are caught with one delegated listener in the capture
   * phase, so links added anywhere on the page are covered without every
   * section needing to know the HUD exists.
   */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (/\.pdf(\?|#|$)/i.test(href)) unlock("recruiter");
      // Scoped to the project sections on purpose: counting *any* outbound link
      // would hand out "Source Diver" for clicking the LinkedIn icon in the
      // footer, which is not what the achievement claims.
      else if (/^https?:\/\//i.test(href) && link.closest("#projects, #archive")) {
        unlock("source-diver");
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [unlock]);

  // Konami code.
  useEffect(() => {
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      // Never swallow keystrokes meant for a field. Nothing on this page takes
      // text today, but a global key listener that also watches inputs is a
      // trap for whatever gets added later.
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;

      const want = KONAMI[pos];
      if (e.key.toLowerCase() === want.toLowerCase()) {
        pos++;
        if (pos === KONAMI.length) {
          pos = 0;
          setDismissed(false);
          setOpen(true);
          unlock("konami");
        }
      } else {
        // A wrong key restarts — unless it's the sequence's own first key.
        pos = e.key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlock]);

  // Escape closes the list, the way every other disclosure on the web does.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Phones have no keyboard, so the secret needs a touch route too.
  const tapsRef = useRef({ count: 0, last: 0 });
  const onBadgeTap = () => {
    const now = performance.now();
    const t = tapsRef.current;
    t.count = now - t.last < 600 ? t.count + 1 : 1;
    t.last = now;
    if (t.count >= 8) {
      t.count = 0;
      unlock("konami");
    }
  };

  // Stay out of the way until the reader has committed past the hero.
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pct = total > 0 ? seen.size / total : 0;
  const shown = visible && !dismissed;

  return (
    <>
      <ScrollProgress />

      <AnimatePresence>
        {shown && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2"
          >
            {/* Achievement toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
                  transition={{ duration: 0.3 }}
                  role="status"
                  className="flex items-center gap-2.5 rounded-xl border border-primary/40 bg-card/95 backdrop-blur px-3 py-2 shadow-lg shadow-primary/10"
                >
                  <Trophy className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-primary leading-tight">
                      Achievement
                    </p>
                    <p className="text-xs font-medium text-foreground leading-tight truncate">
                      {toast.label}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Achievement list */}
            <AnimatePresence>
              {open && (
                <motion.ul
                  id="hud-achievements"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.22 }}
                  className="w-56 rounded-xl border border-border bg-card/95 backdrop-blur p-2 shadow-xl space-y-0.5"
                >
                  {ACHIEVEMENTS.map((a) => {
                    const got = unlocked.has(a.id);
                    // A secret stays masked until it's found — that's the point.
                    const name = a.secret && !got ? "???" : a.label;
                    return (
                      <li
                        key={a.id}
                        className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${
                          got ? "text-foreground" : "text-muted-foreground/70"
                        }`}
                      >
                        <span
                          className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            got ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium leading-tight">{name}</span>
                          <span className="block text-[10px] leading-tight text-muted-foreground/70">
                            {a.hint}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>

            {/* The pill itself */}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/95 backdrop-blur pl-1 pr-1 py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setOpen((v) => !v);
                  onBadgeTap();
                }}
                aria-expanded={open}
                aria-controls="hud-achievements"
                aria-label={`Progress: ${seen.size} of ${total} sections explored, ${unlocked.size} of ${ACHIEVEMENTS.length} achievements. Toggle the achievement list.`}
                className="flex items-center gap-2 rounded-full pl-2 pr-2.5 py-1 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="font-mono text-[11px] tabular-nums text-foreground" aria-hidden="true">
                  {seen.size}/{total}
                </span>
                <span
                  className="h-1 w-10 rounded-full bg-muted overflow-hidden hidden sm:block"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full bg-primary origin-left transition-transform duration-500 ease-out"
                    style={{ transform: `scaleX(${pct})`, width: "100%" }}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Hide the progress tracker"
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
