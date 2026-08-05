import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * DotAvatar — a hooded operator rendered as a dot-matrix figure, with a light
 * RPG layer on top.
 *
 * A hooded operator, not a portrait. Two earlier versions drew an actual face:
 * first a stylised bust, then a photograph sampled onto the lattice. Both fought
 * the medium. A face is carried by fine detail this lattice cannot hold, so at
 * 47 dots it degrades toward a skull however the map is authored.
 *
 * This inverts the problem. The figure is a bright hood wrapped around a pure
 * black void, and the only lit thing inside that void is a pair of eyes. A
 * silhouette plus two glowing points is exactly what a coarse lattice renders
 * *well*. The eyes were already procedural, so they still track the cursor,
 * blink and shift with mood — which is what makes it feel like it is watching.
 *
 * Four brightness tiers: the unlit field, the dim folds of the hood, the lit
 * hood edges, and the eyes — hotter and glowing harder than anything else on
 * the canvas, because at this size they carry the entire avatar.
 *
 * Dots are laid out in hexagonal packing (the arrangement blockchain identicons
 * use) rather than a square grid: offsetting every other row removes the harsh
 * vertical seams a square grid shows at this size, and lets a curved jaw read
 * without visible stair-stepping.
 *
 * Progressive disclosure is the design rule. This sits at the top of a page
 * recruiters read, so at rest it is calm: a slow shimmer, eyes that follow the
 * pointer, an occasional blink. Everything loud — the colour flip, the spark
 * burst, the combo counter, levelling up, the gear that unlocks with it — only
 * happens once someone pokes it. Nobody is forced to meet the toy, but anyone
 * who prods it finds one.
 *
 * Canvas, not SVG + React state: this animates every dot every frame, and
 * ~500 re-rendering React nodes at 60fps would drop frames on a mid-range
 * phone, which is where most of this page's traffic lands.
 */

type MoodName = "happy" | "smug" | "wink" | "surprised" | "focused";

// Resting face is the friendly one — it is the first thing a recruiter sees.
// "focused" sits at the end of the cycle rather than the start.
const MOOD_ORDER: MoodName[] = ["happy", "smug", "wink", "surprised", "focused"];

const MOOD_LABEL: Record<MoodName, string> = {
  happy: "shipping",
  smug: "it compiles",
  wink: "no bugs",
  surprised: "prod is down",
  focused: "deep work",
};

/**
 * Hue *offsets* from the theme's primary, not absolute hues, so every mood
 * still derives from the brand colour and both themes stay coherent. "happy"
 * sits at 0 because the resting portrait should be exactly on-brand.
 */
const MOOD_HUE_SHIFT: Record<MoodName, number> = {
  happy: 0,
  smug: 95,
  wink: 150,
  surprised: -140,
  focused: -30,
};

/** Pokes per level. Short enough that a first-time visitor can actually reach one. */
const POKES_PER_LEVEL = 5;

/** Hardware that comes online at each level, and the word shown when it does. */
const UNLOCKS: Record<number, string> = {
  2: "visor",
  3: "overclock",
};

/** Pokes closer together than this chain into a combo. */
const COMBO_WINDOW_MS = 1100;

const XP_KEY = "kg.avatar.xp";

/**
 * Storage is wrapped because it throws outright in Safari private mode and
 * whenever a browser blocks third-party/site data. A portrait that crashes the
 * hero over a saved counter is a bad trade, so failures degrade to "level 1".
 */
function loadXp(): number {
  try {
    const raw = window.localStorage.getItem(XP_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? Math.min(n, 99999) : 0;
  } catch {
    return 0;
  }
}

function saveXp(n: number) {
  try {
    window.localStorage.setItem(XP_KEY, String(n));
  } catch {
    /* storage unavailable — the counter simply won't persist */
  }
}

/* ---------------------------------------------------------------------------
 * Portrait geometry.
 *
 * Coordinates are the panel's own: (0,0) at the centre, ±1 at the edges, y
 * increasing downward. Everything is a fraction of the tile, so the whole
 * figure scales with it and none of these numbers need revisiting when the
 * avatar is resized.
 *
 * These were tuned against the actual 47-column lattice rather than by eye in
 * continuous space. Two things only show up once quantised: a feature narrower
 * than a cell disappears entirely, and a curve shallower than one row (the
 * mouth) comes out dead straight.
 * ------------------------------------------------------------------------ */

/**
 * The hood, sampled from flat vector art onto the lattice.
 *
 * Two earlier versions of this were a face — first a stylised bust drawn cell
 * by cell, then a photograph. Both failed the same way: a likeness lives in
 * fine detail, and even at 47 columns the head spans only about thirty dots, so
 * the brow, jaw and mouth get two or three cells each and the result drifts
 * toward a skull however carefully the map is authored.
 *
 * A hooded silhouette needs the opposite of detail. It is one strong shape
 * wrapped around a pure black void, and that void is where the renderer's
 * procedural eyes go — so the lattice is asked for nothing but a rim and a
 * hole, which is exactly what it is good at.
 *
 * Each character is a tone from `TONE`, darkest to brightest, and the darkest
 * really do fall away to nothing. There is no brightness floor: the face void
 * and the space outside the figure both sit at zero, and the hood's lit edge is
 * the only thing that makes the void read as an *inside*. Any floor at all
 * fills it in and the hood flattens to a bright blob. The glow belongs to the
 * renderer, never to the map.
 *
 * Rows alternate 48 and 47 characters because the lattice is hex-packed: every
 * other row is offset half a cell and carries one extra dot. Each dot indexes
 * its row and column directly rather than rounding its position — .5 rounds
 * toward positive infinity, which shifts offset rows a column left on one side
 * and right on the other and makes the figure visibly lopsided.
 *
 * Regenerate with `node tools/avatar-map/gen-avatar-map.mjs`, which mirrors the
 * lattice geometry below and rewrites this array in place, so the map and the
 * renderer cannot drift apart. Editing it by hand will not survive that.
 */
const TONE = " .:-=+*#%@";

const HOOD = [
  "                                                ",
  "                                               ",
  "                       ::                       ",
  "                     -#%#-                     ",
  "                    -#%%#%#-                    ",
  "                  :#@%%#%%%#:                  ",
  "                 .+@%%%%#%%%%+.                 ",
  "                :%@%%%%##%%%%%:                ",
  "                :%%%%%%%*#%%%%%:                ",
  "               :%@%%%@@#*#%%%%%.               ",
  "               .#%%%@@@%***##%##.               ",
  "              .#%%%@@@%%#######*               ",
  "               +%%%%%@@@@%###*#%+               ",
  "              =@%%%%@@*-*@%#***%=              ",
  "              :%%#%%@#:  :#%%#+*%:              ",
  "             .%##%@%-     -%%%**#.             ",
  "              *%%%%=       .+%%#**              ",
  "             +%%@*.         .*%#*=             ",
  "             -%%@+            +%*#-             ",
  "            :%%@+             +%*#:            ",
  "            .#%@*              *%*#             ",
  "            *%@#.             .#%#+            ",
  "            =%@#.              .#%#=            ",
  "           -%@%.               .%%%:           ",
  "           .%@%:                :%@#.           ",
  "           *@%:                 :%@*           ",
  "           =@@-                  -@@=           ",
  "          :@@=                   =@%:          ",
  "          .#@+                    +%#           ",
  "          .*%-                   -%*.          ",
  "           .+%=                  =%+.           ",
  "            =#+                 +#=            ",
  "            .=#*                **=.            ",
  "           :+-*#.             .#*-+:           ",
  "           :%*-+#-            -#+-*%:           ",
  "          :+%#-+#+           +#=-*%+:          ",
  "         :***%#==*#.        :#+=-*%+**:         ",
  "       .+@%**#*=-+#=       =#=--*#**%@+.       ",
  "      .+%%%%*+++=-=+*.    .*+=--+++*%%%%=.      ",
  "      -#%%%%++++=:==*     *==:=++=+%%%%#-      ",
  "    .=#%*%%%%+=*#+---*    *---+**-+%%%%*%#=.    ",
  "   .#%%%##%%%*-=##+=-+   *--+##=-+%%%##%%%#.   ",
  "    .+%%%#*#%#*+-=##=-+  +-=**=:=+#%#*#%%%*.    ",
  "     .+%%%*#%##*=:*%*== ==+#+:-+*#%##%%%*.     ",
  "       .+%%#*####+--##=-==##--+*##%*#%%+.       ",
  "        .=%#*%###*=-*#===#+-=*###%##%=.        ",
  "          .=##%####+-+*==*+-+*###%##=           ",
  "            -+%####+-*+=++-+####%+-            ",
  "              .=+++*=-+==+-=*+++=.              ",
  "                                               ",
  "                                                ",
  "                                               ",
  "                                                ",
  "                                               ",
  "                                                ",
];

/** One lattice row, in portrait units. Vertical offsets below are written as
 *  multiples of it: anything shallower than a row quantises away to nothing. */
const ROW = 0.037;

/** Lattice geometry. `MR0`, `MC_EVEN` and `MC_ODD` place a dot's (row, column)
 *  into the map above; they are derived from `COLS` and must move with it. */
const COLS = 47;
const MR0 = 27;
const MC_EVEN = 23;
const MC_ODD = 24;

/**
 * The eyes, placed inside the hood's void.
 *
 * The void runs from about y=-0.49 to y=+0.57 and is widest across its middle,
 * so these sit in its upper third — where a face's eyes would be, and far
 * enough inside the rim that a full gaze deflection cannot push them onto the
 * hood itself.
 *
 * Wide and shallow on purpose. A round eye at this size reads as a cartoon
 * googly; flattening it to a slit is what makes it read as a narrowed,
 * deliberate stare, which is the entire character of the thing.
 */
const EYE_X = 0.175;
const EYE_Y = -0.13;
const EYE_RX = 0.115;
const EYE_RY = 0.055;
/** Floor for a squeezed-shut eye: below about half a row the shape falls
 *  between lattice rows and the closed eye vanishes instead of closing. */
const EYE_SHUT = ROW * 0.44;

interface Pt {
  x: number;
  y: number;
}

/** An elliptical region. `k` scales how strongly it lights. */
interface Blob {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  k: number;
}

/** A polyline. Straight segments only — exact segment distance is far cheaper
 *  per dot than sampling a curve into points, and at this resolution three
 *  segments are indistinguishable from a true arc. */
interface Line {
  pts: Pt[];
  w: number;
  k: number;
}

interface Look {
  /** Lit hotter than anything else on the canvas, and the only shapes that
   *  track the gaze. There is no face here, so the eyes ARE the expression —
   *  every mood below is expressed purely by changing their shape. */
  eyes: Blob[];
  /** Lit with the eyes: the visor bar and the readout line, once unlocked. */
  rig: Line[];
}

function lookFor(mood: MoodName, level: number): Look {
  const eyes: Blob[] = [];
  const rig: Line[] = [];

  const hasVisor = level >= 2;
  const hasReadout = level >= 3;

  let rx = EYE_RX;
  let ry = EYE_RY;
  let leftRy = ry;
  let leftLift = 0;
  let rightLift = 0;

  switch (mood) {
    case "smug":
      // One eye narrowed, the other lifted. With no mouth to smirk with, the
      // asymmetry has to carry the whole joke on its own.
      leftRy = ry * 0.5;
      rightLift = -ROW * 0.5;
      break;

    case "wink":
      // Squeezed shut, not removed — a missing eye reads as a rendering bug
      // rather than as a wink.
      leftRy = EYE_SHUT;
      leftLift = -ROW * 0.4;
      break;

    case "surprised":
      // The one mood allowed to break the slit and go round.
      rx = 0.088;
      ry = 0.082;
      leftRy = ry;
      break;

    case "focused":
      // Down to a hard line. Narrowing reads as concentration where shrinking
      // would just make the avatar fainter.
      rx = 0.128;
      ry = ROW * 0.42;
      leftRy = ry;
      break;

    case "happy":
    default:
      // The resting stare. Nothing to add.
      break;
  }

  eyes.push(
    { cx: -EYE_X, cy: EYE_Y + leftLift, rx, ry: leftRy, k: 1 },
    { cx: EYE_X, cy: EYE_Y + rightLift, rx, ry, k: 1 },
  );

  if (hasVisor) {
    // A scan bar bridging the two eyes, so the pair reads as one piece of
    // hardware instead of two lights that happen to be side by side. Held to
    // just past the outer edge of each eye: the void narrows quickly and a
    // wider bar would run out onto the hood.
    rig.push({
      pts: [
        { x: -EYE_X - EYE_RX * 1.15, y: EYE_Y },
        { x: EYE_X + EYE_RX * 1.15, y: EYE_Y },
      ],
      w: 0.012,
      k: 0.5,
    });
  }

  if (hasReadout) {
    // A readout line below the eyes, at the widest part of the void. Short and
    // centred, because the void closes in fast on either side of it.
    rig.push({
      pts: [
        { x: -0.13, y: EYE_Y + ROW * 4.2 },
        { x: 0.13, y: EYE_Y + ROW * 4.2 },
      ],
      w: 0.011,
      k: 0.7,
    });
  }

  return { eyes, rig };
}

/** 1 when x is at or below `full`, 0 at or above `none`, smooth in between.
 *  Passing `full` above `none` inverts it; nothing does so now that the figure
 *  itself comes from the sampled hood map instead of overlapping falloff
 *  fields. */
function soft(none: number, full: number, x: number): number {
  const t = Math.min(1, Math.max(0, (none - x) / (none - full)));
  return t * t * (3 - 2 * t);
}

/** Squared distance from a point to a polyline. */
function lineDist2(px: number, py: number, pts: Pt[]): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i].x;
    const ay = pts[i].y;
    const bx = pts[i + 1].x - ax;
    const by = pts[i + 1].y - ay;
    const len2 = bx * bx + by * by;
    let t = len2 > 0 ? ((px - ax) * bx + (py - ay) * by) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = px - (ax + bx * t);
    const dy = py - (ay + by * t);
    const d2 = dx * dx + dy * dy;
    if (d2 < best) best = d2;
  }
  return best;
}

interface Dot {
  bx: number;
  by: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  intensity: number;
  /** Falls to 0 toward the edge of the tile, so the lattice dissolves into the
   *  page instead of stopping dead at a boundary. */
  edge: number;
  /** Position in the bottom-row XP strip, or -1 for an ordinary portrait dot. */
  xp: number;
  /** Row and column this dot reads from the hood map. */
  mr: number;
  mc: number;
  /** Eased eye brightness, kept apart from `intensity` so a blink can snap shut
   *  faster than the hood's own shimmer settles. */
  eyeI: number;
  /** Where the dot is actually painted this frame — its position plus any
   *  glitch tear. Kept separate so a tear never accumulates into the lattice. */
  tx: number;
  /** Draw values for the current frame: radius, alpha, and which pass owns it.
   *  Kept on the dot so the render passes do not allocate. */
  dr: number;
  da: number;
  tier: number;
}

/** A shockwave through the lattice. `power` scales with the combo. */
interface Burst {
  born: number;
  power: number;
  seeded: boolean;
}

/** Debris thrown off by a poke. Lives in canvas space, dies after ~800ms. */
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
}

export function DotAvatar({ label, className = "" }: { label: string; className?: string }) {
  const hostRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Saved progress is read during the first render rather than in an effect.
  // Loading it in an effect left a window where a fast first click incremented
  // from zero and was then overwritten by the stored value — the click was lost
  // and the ref/state pair diverged. useRef gives it a once-only read that
  // useState's lazy initialiser can also see.
  const initialXpRef = useRef<number | null>(null);
  if (initialXpRef.current === null) initialXpRef.current = loadXp();
  const initialXp = initialXpRef.current;

  const [moodIndex, setMoodIndex] = useState(0);
  const [xp, setXp] = useState(initialXp);
  const [combo, setCombo] = useState(0);
  const [leveled, setLeveled] = useState(false);
  const [touched, setTouched] = useState(initialXp > 0);

  // Animation state lives in refs: it changes every frame and must never
  // trigger a React render.
  const moodRef = useRef<MoodName>(MOOD_ORDER[0]);
  const hueShiftRef = useRef(0);
  /** Cursor position in *client* coordinates, or inactive once the cursor has
   *  left the window. Stored raw and converted to portrait space per frame,
   *  because the tile slides under the cursor whenever the page scrolls. */
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const burstsRef = useRef<Burst[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const chargeRef = useRef(0);
  const repaintRef = useRef<(() => void) | null>(null);

  // Mirrors of state the poke handler needs synchronously. Reading `xp` from
  // the closure would go stale between renders, and updating it from inside a
  // setState updater would fire the level-up side effect twice under StrictMode.
  const xpRef = useRef(initialXp);
  const comboRef = useRef(0);
  const lastPokeRef = useRef(0);
  const comboTimerRef = useRef(0);
  const levelTimerRef = useRef(0);

  const level = Math.floor(xp / POKES_PER_LEVEL) + 1;

  useEffect(() => {
    moodRef.current = MOOD_ORDER[moodIndex];
    hueShiftRef.current = MOOD_HUE_SHIFT[MOOD_ORDER[moodIndex]];
    // With motion reduced there is no loop running to pick this up.
    if (prefersReducedMotion) repaintRef.current?.();
  }, [moodIndex, prefersReducedMotion]);

  useEffect(() => {
    chargeRef.current = (xp % POKES_PER_LEVEL) / POKES_PER_LEVEL;
    if (prefersReducedMotion) repaintRef.current?.();
  }, [xp, prefersReducedMotion]);

  useEffect(
    () => () => {
      window.clearTimeout(comboTimerRef.current);
      window.clearTimeout(levelTimerRef.current);
    },
    [],
  );

  const poke = () => {
    const now = performance.now();
    setTouched(true);
    setMoodIndex((i) => (i + 1) % MOOD_ORDER.length);

    const chained = now - lastPokeRef.current < COMBO_WINDOW_MS;
    lastPokeRef.current = now;
    comboRef.current = chained ? comboRef.current + 1 : 1;
    setCombo(comboRef.current);

    // Combo lapses on its own so the counter never lingers at "x7" on a page
    // nobody is touching any more.
    window.clearTimeout(comboTimerRef.current);
    comboTimerRef.current = window.setTimeout(() => {
      comboRef.current = 0;
      setCombo(0);
    }, COMBO_WINDOW_MS + 400);

    const next = xpRef.current + 1;
    const levelledUp = Math.floor(next / POKES_PER_LEVEL) > Math.floor(xpRef.current / POKES_PER_LEVEL);
    xpRef.current = next;
    setXp(next);
    saveXp(next);

    burstsRef.current.push({
      born: now,
      power: levelledUp ? 2.6 : Math.min(2.2, 1 + (comboRef.current - 1) * 0.28),
      seeded: false,
    });

    if (levelledUp) {
      setLeveled(true);
      window.clearTimeout(levelTimerRef.current);
      levelTimerRef.current = window.setTimeout(() => setLeveled(false), 2400);
    }

    // A short tick on Android makes the poke feel physical. iOS Safari does not
    // implement this and simply ignores the call.
    if (!prefersReducedMotion) navigator.vibrate?.(levelledUp ? 32 : comboRef.current > 1 ? 18 : 12);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dots: Dot[] = [];
    let size = 0;
    let dotR = 0;
    let radius = 0;
    let unit = 0;
    let stripCount = 0;
    // One lattice cell, expressed in portrait units — the quantum the gaze
    // moves in.
    let latticeStep = 0;
    let lastGazeCell = "";
    let rowStep = 0;
    let glow = 0;
    let raf = 0;
    let running = false;

    // Colours come from the theme's CSS variables, re-read whenever the theme
    // class flips, so the avatar follows dark/light without duplicating values.
    let baseHue = 180;
    let sat = "100%";
    let light = "45%";
    /** `light` as a number, so the hotter eye colour can be derived from it. */
    let lightNum = 45;
    /** Whether the page behind the avatar is dark. The eyes and the glitch
     *  fringes have to be the hottest thing on the canvas in *both* themes, and
     *  which direction that is flips with the theme: simply lightening them
     *  works on the dark page and fails on the light one, where a paler cyan on
     *  near-white is less visible than the hood it is meant to outshine. */
    let darkPage = true;
    let colBase = "hsl(240 10% 60% / 0.28)";

    // Transmission-glitch state. Fires on a loose timer and on every poke: a
    // short window where the eye pass splits into colour fringes and one
    // horizontal band of the figure is dragged sideways. Held out here rather
    // than in draw() so a single glitch spans the frames it takes to read.
    let nextGlitch = 0;
    let glitchUntil = 0;
    let glitchSplit = 0;
    let glitchBandY = 0;
    let glitchShift = 0;

    function readColors() {
      const styles = getComputedStyle(document.documentElement);
      const primaryRaw = styles.getPropertyValue("--primary").trim() || "180 100% 45%";
      const parts = primaryRaw.split(/\s+/);
      baseHue = parseFloat(parts[0]);
      if (!Number.isFinite(baseHue)) baseHue = 180;
      sat = parts[1] || "100%";
      light = parts[2] || "45%";
      lightNum = Number.parseFloat(light);
      if (!Number.isFinite(lightNum)) lightNum = 45;

      // Unparseable or missing falls through to "dark", which is this site's
      // default theme and the one the avatar was tuned against.
      const bgL = Number.parseFloat(
        (styles.getPropertyValue("--background").trim().split(/\s+/)[2] ?? "").replace("%", ""),
      );
      darkPage = !Number.isFinite(bgL) || bgL < 50;

      const muted = styles.getPropertyValue("--muted-foreground").trim() || "240 10% 60%";
      // Strong enough that the unlit lattice reads as deliberate texture rather
      // than noise, faint enough that the figure still pops out of it.
      colBase = `hsl(${muted} / 0.38)`;
    }

    function build() {
      const rect = host!.getBoundingClientRect();
      size = Math.min(rect.width, rect.height);
      if (size <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
      // The translate components of setTransform are in *device* pixels — they
      // are not put through the dpr scale that precedes them. Deriving them
      // from the CSS rect therefore parked the origin at half a CSS width into
      // a backing store `dpr` times wider, i.e. at 1/(2*dpr) of the tile, and
      // on every retina or browser-zoomed display the whole figure sat up and
      // to the left with its left edge clipped off. Centre on the backing store.
      ctx!.setTransform(dpr, 0, 0, dpr, canvas!.width / 2, canvas!.height / 2);

      const pad = size * 0.06;
      const half = size * 0.5 - pad;
      // General scale for bursts, sparks and hover falloff.
      radius = half;
      // Portrait space is the panel itself: ±1 edge to edge.
      unit = half;

      /**
       * 47 columns.
       *
       * A feature needs roughly three dots across to resolve at all. At 23 the
       * hood's rim was a single cell wide, so it aliased away on alternate rows
       * and the silhouette broke into dashes; the eyes had one dot each and no
       * expression survived. Doubling the lattice gives the rim a solid two
       * cells and the eyes about five, which is what makes the figure read.
       */
      const spacing = (half * 2) / COLS;
      dotR = spacing * 0.36;
      // The glow must stay narrower than the gap between dots. At small sizes a
      // blur scaled purely off `size` grew wider than the spacing, so lit dots
      // bled into each other and the figure turned into a blob.
      glow = Math.min(size * 0.05, spacing * 0.4);
      const rowH = spacing * 0.87;

      latticeStep = spacing / unit;
      // Two rows, not one: alternate rows are offset by half a cell, so a
      // one-row shift lands the features on the opposite parity and changes
      // which dots they light. Two rows map the lattice back onto itself.
      rowStep = (rowH * 2) / unit;

      const next: Dot[] = [];
      const rowN = Math.ceil(half / rowH);
      const colN = Math.ceil(half / spacing);
      for (let r = -rowN; r <= rowN; r++) {
        const y = r * rowH;
        if (Math.abs(y) > half + 0.01) continue;

        // Offset rows sit on a half-step grid that is still centred on zero.
        // Adding spacing/2 to a symmetric range (the obvious way to write this)
        // shifts the whole row sideways instead, and the accumulated drift is
        // what made the face look subtly lopsided.
        const odd = Math.abs(r) % 2 === 1;
        for (let c = odd ? -colN - 1 : -colN; c <= colN; c++) {
          const x = odd ? (c + 0.5) * spacing : c * spacing;
          if (Math.abs(x) > half + 0.01) continue;

          // Dissolve the field toward the edge rather than culling it to the
          // tile's shape. Any hard boundary — even one rounded to match the
          // corners — draws the eye to the container and the portrait reads as
          // something sealed in a box. Fading it out lets the head sit in open
          // space. The corners reach zero, which is what actually removes the
          // square; the edge midpoints stay part-lit so the XP strip along the
          // bottom row still has a lattice to sit in.
          const e = Math.hypot(x, y) / half;
          const edge = Math.max(0, Math.min(1, (1.34 - e) / 0.5));
          if (edge <= 0.001) continue;

          next.push({
            edge,
            bx: x,
            by: y,
            x,
            y,
            vx: 0,
            vy: 0,
            phase: (x + y) * 0.045,
            intensity: 0,
            eyeI: 0,
            tx: x,
            xp: -1,
            mr: r + MR0,
            mc: odd ? c + MC_ODD : c + MC_EVEN,
            dr: 0,
            da: 0,
            tier: 0,
          });
        }
      }

      // The bottom row doubles as the XP strip, filling left to right. Before
      // the first poke it is simply unlit, indistinguishable from the rest of
      // the lattice — so nothing about it is visible until it means something.
      let lowest = -Infinity;
      for (const d of next) if (d.by > lowest) lowest = d.by;
      const strip = next
        .filter((d) => Math.abs(d.by - lowest) < 0.01)
        .sort((a, b) => a.bx - b.bx);
      strip.forEach((d, i) => {
        d.xp = i;
      });
      stripCount = strip.length;

      dots = next;
    }

    let nextBlink = performance.now() + 2200 + Math.random() * 3200;
    let blinkUntil = 0;
    let gazeX = 0;
    let gazeY = 0;
    let charge = 0;
    let hue = baseHue;
    let hueReady = false;

    // The look only changes when the mood or the unlocked gear does, so it is
    // built once and reused. Rebuilding ~20 small objects every frame is pure
    // garbage for the collector to sweep on a phone.
    let look = lookFor(MOOD_ORDER[0], 1);
    let lookKey = "";

    /**
     * Renders one frame. `snap` skips easing so a single static paint (reduced
     * motion) lands on the final look instead of 22% of the way toward it.
     */
    function draw(now: number, snap = false) {
      if (!dots.length || !ctx) return;

      const t = now / 1000;
      // The gaze follows the cursor anywhere on the page, not merely while it
      // is over the tile. A face that only looks at you once you are already
      // hovering it is a face almost nobody discovers.
      const rawPointer = pointerRef.current;
      let pointerX = 0;
      let pointerY = 0;
      let pointerActive = false;
      if (rawPointer.active && !snap) {
        const pr = host!.getBoundingClientRect();
        pointerX = rawPointer.x - pr.left - pr.width / 2;
        pointerY = rawPointer.y - pr.top - pr.height / 2;
        pointerActive = true;
      }
      const mood = moodRef.current;
      const lvl = Math.floor(xpRef.current / POKES_PER_LEVEL) + 1;

      // Capped: past the last unlock the look stops changing, so the key
      // shouldn't keep churning and rebuilding an identical object.
      const key = `${mood}|${Math.min(lvl, 3)}`;
      if (key !== lookKey) {
        look = lookFor(mood, lvl);
        lookKey = key;
      }

      // Hue eases toward the current mood along the shortest way round the
      // colour wheel, so cyan -> violet doesn't detour through orange.
      const targetHue = baseHue + hueShiftRef.current;
      if (!hueReady) {
        hue = targetHue;
        hueReady = true;
      } else {
        const delta = ((targetHue - hue + 540) % 360) - 180;
        hue += delta * (snap ? 1 : 0.14);
      }
      const hh = ((hue % 360) + 360) % 360;
      const colLit = `hsl(${hh} ${sat} ${light})`;
      // The eyes are pushed away from the page's own lightness, so they stay
      // the brightest thing here whichever theme is on.
      const eyeL = darkPage ? Math.min(92, lightNum + 30) : Math.max(16, lightNum - 26);
      const colEye = `hsl(${hh} ${sat} ${eyeL}%)`;
      // Fringe hues sit either side of the brand hue rather than on fixed red
      // and cyan, so the glitch stays inside the theme in both light and dark.
      const fringeL = darkPage ? 62 : 42;
      const colFringeA = `hsl(${(hh + 300) % 360} 100% ${fringeL}%)`;
      const colFringeB = `hsl(${(hh + 62) % 360} 100% ${fringeL}%)`;

      if (!snap && now > nextBlink) {
        blinkUntil = now + 120;
        nextBlink = now + 2600 + Math.random() * 3800;
      }
      const blinking = !snap && now < blinkUntil;

      let targetGazeX = 0;
      let targetGazeY = 0;
      if (pointerActive) {
        const d = Math.hypot(pointerX, pointerY) || 1;
        // Saturates about two tile-radii out, so anywhere on the page gives a
        // full-deflection stare, while a cursor resting on the face itself
        // eases back toward centre instead of jittering at the extreme.
        const reach = Math.min(1, d / (radius * 2.2));
        targetGazeX = (pointerX / d) * reach * 0.16;
        targetGazeY = (pointerY / d) * reach * 0.16;
      } else if (!snap) {
        // Nothing to follow — wander. A touch device has no pointer at all, so
        // without this the face sat perfectly still between taps and read as a
        // static image. Two detuned sines give drift that never visibly loops.
        targetGazeX = Math.sin(t * 0.31) * 0.09 + Math.sin(t * 0.13 + 1.7) * 0.05;
        targetGazeY = Math.sin(t * 0.23 + 0.9) * 0.06;
      }
      gazeX += (targetGazeX - gazeX) * (snap ? 1 : 0.12);
      gazeY += (targetGazeY - gazeY) * (snap ? 1 : 0.12);

      /**
       * The gaze moves in whole lattice cells.
       *
       * Sliding the eyes by a fraction of a cell makes each eye sample the dot
       * grid differently, so the two stop being mirror images and the face
       * looks lopsided and mushy — subtly, constantly, and worst at small
       * sizes. Snapping to the grid keeps them identical, and stepped movement
       * is what a dot-matrix display would actually do.
       */
      const gxCell = latticeStep > 0 ? Math.round(gazeX / latticeStep) : 0;
      const gyCell = rowStep > 0 ? Math.round(gazeY / rowStep) : 0;
      const gx = gxCell * latticeStep;
      const gy = gyCell * rowStep;

      // Dev-only mirror of the quantised gaze. Canvas pixels cannot be asserted
      // against reliably, so tests read this attribute instead. Written only
      // when the cell actually changes, which is rare precisely because the
      // gaze is quantised — so this is not a per-frame DOM write.
      if (import.meta.env.DEV) {
        const cell = `${gxCell},${gyCell}`;
        if (cell !== lastGazeCell) {
          lastGazeCell = cell;
          host!.dataset.gaze = cell;
        }
      }

      const bursts = burstsRef.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        if (now - bursts[i].born > 900) bursts.splice(i, 1);
      }

      // Sparks are seeded here rather than in the click handler because this is
      // where the lattice radius is known.
      if (!snap) {
        for (const b of bursts) {
          if (b.seeded) continue;
          b.seeded = true;
          // A static paint marks the burst seeded and stops there. Skipping the
          // bookkeeping too would leave an unseeded burst behind whenever the
          // visitor pokes with reduced motion on, and re-enabling motion inside
          // the burst's lifetime would then replay sparks and a glitch for an
          // interaction that already happened.
          if (snap) continue;
          // A poke tears the signal as well as throwing sparks, so the hit
          // lands on the image itself and not only on the debris around it.
          glitchUntil = Math.max(glitchUntil, now + 150);
          glitchSplit = dotR * 1.9 * (Math.random() < 0.5 ? -1 : 1);
          glitchBandY = (Math.random() * 2 - 1) * radius * 0.5;
          glitchShift = dotR * 2.4 * (Math.random() < 0.5 ? -1 : 1);
          const count = Math.round(10 + b.power * 7);
          for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = radius * (0.012 + Math.random() * 0.022) * b.power;
            sparksRef.current.push({
              x: Math.cos(a) * radius * 0.18,
              y: Math.sin(a) * radius * 0.18,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed,
              born: now,
              life: 520 + Math.random() * 320,
            });
          }
        }
        // Hard cap: a determined masher could otherwise queue thousands.
        if (sparksRef.current.length > 260) {
          sparksRef.current.splice(0, sparksRef.current.length - 260);
        }
      }

      charge += (chargeRef.current - charge) * (snap ? 1 : 0.1);

      // Scheduled glitches, on top of the ones every poke fires. The interval
      // is deliberately long and irregular: a tear every second stops reading
      // as a fault in the transmission and starts reading as an animation.
      if (!snap && now > nextGlitch) {
        if (nextGlitch > 0) {
          glitchUntil = now + 90 + Math.random() * 110;
          glitchSplit = dotR * (0.8 + Math.random() * 1.4) * (Math.random() < 0.5 ? -1 : 1);
          glitchBandY = (Math.random() * 2 - 1) * radius * 0.7;
          glitchShift = dotR * (1.2 + Math.random() * 2.4) * (Math.random() < 0.5 ? -1 : 1);
        }
        nextGlitch = now + 4200 + Math.random() * 7000;
      }
      const glitching = !snap && now < glitchUntil;

      ctx.clearRect(-size, -size, size * 2, size * 2);

      const breathe = snap ? 1 : 1 + Math.sin(t * 1.1) * 0.012;
      // Amplitude of the per-dot wander. Held to about half a dot radius: past
      // that the lattice stops reading as a lattice and the features smear.
      const drift = snap ? 0 : dotR * 0.5;

      ctx.fillStyle = colBase;
      for (const dot of dots) {
        const nx = dot.bx / unit;
        const ny = dot.by / unit;

        let v = 0;
        let eyeV = 0;

        if (dot.xp >= 0) {
          // XP strip. Filled per whole dot rather than by fraction: a lone
          // half-lit dot on the boundary reads as a rendering glitch, where a
          // clean on/off edge reads as a bar. The intensity easing below still
          // fades each one in, so it never looks like a hard toggle.
          v = charge * stripCount >= dot.xp + 0.5 ? 1 : 0;
        } else {
          // --- the hood -----------------------------------------------------
          // Straight lookup into the sampled map. Tone is an index into the
          // ramp rather than a few fixed tiers, which is what lets the folds
          // inside the hood separate from its lit outer edge.
          const mapRow = HOOD[dot.mr];
          const cell = mapRow ? mapRow[dot.mc] : undefined;
          const ti = cell === undefined ? -1 : TONE.indexOf(cell);
          v = ti > 0 ? ti / (TONE.length - 1) : 0;

          // --- the eyes, lit rather than carved -------------------------------
          // The photographic version cut its features out of a lit face. There
          // is no face here: the eyes are the only thing burning inside a black
          // void, so they *add* light, and they are tracked separately from `v`
          // so a later pass can run them hotter than the hood around them.
          for (const e of look.eyes) {
            const dx = (nx - (e.cx + gx)) / e.rx;
            // Blinking squeezes the lid shut rather than shrinking the eye.
            const ry = blinking ? Math.min(e.ry, EYE_SHUT) : e.ry;
            const dy = (ny - (e.cy + gy)) / ry;
            eyeV = Math.max(eyeV, soft(1.25, 0.5, dx * dx + dy * dy) * e.k);
          }
          // The rig tracks the gaze at a third of the deflection, so it reads
          // as hardware bolted to the hood with the eyes moving behind it.
          for (const l of look.rig) {
            const d2 = lineDist2(nx - gx * 0.35, ny - gy * 0.35, l.pts);
            eyeV = Math.max(eyeV, soft(l.w * l.w * 2.6, l.w * l.w * 0.5, d2) * l.k);
          }
        }

        dot.intensity += (v - dot.intensity) * (snap ? 1 : 0.22);
        // Eased faster than the hood. At the body's rate a blink reads as the
        // eyes dimming and coming back up, not as an eyelid.
        dot.eyeI += (eyeV - dot.eyeI) * (snap ? 1 : 0.34);

        if (snap) {
          dot.x = dot.bx;
          dot.y = dot.by;
        } else {
          // Spring back toward the lattice position, which itself wanders. The
          // phase comes from the dot's own coordinates, so neighbours drift
          // together in slow currents; seeding it randomly per dot instead just
          // reads as noise and destroys the halftone.
          const wx = Math.sin(t * 0.29 + dot.phase * 1.7) * drift;
          const wy = Math.cos(t * 0.23 + dot.phase * 2.1) * drift;
          let ax = (dot.bx + wx - dot.x) * 0.14;
          let ay = (dot.by + wy - dot.y) * 0.14;

          for (const b of bursts) {
            const age = (now - b.born) / 1000;
            const dx = dot.x;
            const dy = dot.y;
            const d = Math.hypot(dx, dy) || 1;
            // A ring of force travelling outward from the centre of the poke.
            const wave = Math.exp(-Math.pow(d / radius - age * 2.2, 2) * 6) * Math.exp(-age * 2.4);
            ax += (dx / d) * wave * 22 * b.power;
            ay += (dy / d) * wave * 22 * b.power;
          }

          dot.vx = (dot.vx + ax) * 0.86;
          dot.vy = (dot.vy + ay) * 0.86;
          dot.x += dot.vx;
          dot.y += dot.vy;
        }

        let hover = 0;
        if (pointerActive) {
          const d = Math.hypot(dot.x - pointerX, dot.y - pointerY);
          hover = soft(radius * 0.85, 0, d) * 0.45;
        }

        const shimmer = snap ? 1 : 1 + Math.sin(t * 1.7 + dot.phase) * 0.14;
        // Tone is carried by dot *size*, the way an actual halftone works.
        // Leaning on opacity instead made the mid tones half as bright as the
        // dark ones on top of being smaller, and the figure collapsed into a
        // hollow inside a bright arch.
        // The XP strip opts out of the edge fade. It lives on the bottom row,
        // where the fade is strongest, and it is a readout rather than part of
        // the figure — dimming it to a third would make the reward for poking
        // almost invisible.
        const fade = dot.xp >= 0 ? 1 : dot.edge;
        const eyeA = dot.eyeI * fade;
        // An eye dot is drawn fatter than a hood dot of the same brightness.
        // Since tone here is carried by size, this is what actually makes the
        // eyes burn rather than merely be a lighter shade of the hood.
        const r =
          dotR *
          (0.32 + 1.05 * dot.intensity + 0.85 * dot.eyeI) *
          shimmer *
          (1 + hover) *
          breathe *
          fade;
        const a = dot.intensity * fade;

        // A horizontal slice of the figure dragged sideways, the way a weak
        // signal tears a scanline. Applied at paint time only, so the tear
        // snaps back cleanly instead of accumulating into the lattice.
        dot.tx =
          dot.x + (glitching && Math.abs(dot.by - glitchBandY) < radius * 0.1 ? glitchShift : 0);

        // Four tiers: the unlit field, the dim folds of the hood, its lit outer
        // edge, and the eyes. The field is drawn here; the rest are deferred so
        // each configures its fill and glow once, and they are tagged on the
        // dot rather than pushed into per-frame arrays.
        //
        // The first boundary sits just above zero rather than at a quarter
        // brightness. The map has no floor, so the deepest folds land between
        // 0.1 and 0.25, and a higher cut-off drew them in the *field* colour —
        // indistinguishable from the empty lattice around them, which broke the
        // silhouette into disconnected bright patches.
        dot.dr = r;
        if (eyeA > 0.06) {
          // The eyes outrank whatever the map says here. In practice they sit
          // in the void and there is nothing to lose, but a full gaze
          // deflection can graze the rim, and an eye must stay an eye.
          dot.tier = 3;
          dot.da = Math.min(1, eyeA);
        } else if (a < 0.075) {
          dot.tier = 0;
          ctx.beginPath();
          ctx.arc(dot.tx, dot.y, Math.max(0.4, r), 0, Math.PI * 2);
          ctx.fill();
        } else if (a < 0.7) {
          dot.tier = 1;
          dot.da = a;
        } else {
          dot.tier = 2;
          dot.da = Math.min(1, a);
        }
      }

      // The folds inside the hood: same hue as its lit edge, only held back.
      // The separation comes from dot size and from the glow on the pass below,
      // not from making this tier faint — that was what hollowed out the figure.
      ctx.save();
      ctx.fillStyle = colLit;
      for (const dot of dots) {
        if (dot.tier !== 1) continue;
        // Ramps from nearly nothing so this tier meets the unlit field without
        // a visible step; starting at half opacity put a hard edge around the
        // figure and made the dim mass read as a separate object.
        ctx.globalAlpha = 0.14 + dot.da * 0.8;
        ctx.beginPath();
        ctx.arc(dot.tx, dot.y, Math.max(0.4, dot.dr), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // The lit edge of the hood, in one pass so the glow is configured once.
      ctx.save();
      ctx.shadowColor = colLit;
      ctx.shadowBlur = glow;
      ctx.fillStyle = colLit;
      for (const dot of dots) {
        if (dot.tier !== 2) continue;
        ctx.globalAlpha = dot.da;
        ctx.beginPath();
        ctx.arc(dot.tx, dot.y, Math.max(0.4, dot.dr), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // The eyes. Hotter colour and a far wider glow than the hood, drawn after
      // it so nothing can sit on top of them. This is the whole avatar: two lit
      // points in a black void, which is the one thing 47 dots render properly.
      ctx.save();
      ctx.shadowColor = colEye;
      ctx.shadowBlur = glow * 2.8;
      ctx.fillStyle = colEye;
      for (const dot of dots) {
        if (dot.tier !== 3) continue;
        ctx.globalAlpha = dot.da;
        ctx.beginPath();
        ctx.arc(dot.tx, dot.y, Math.max(0.6, dot.dr), 0, Math.PI * 2);
        ctx.fill();
      }
      // Chromatic split, and only while glitching. Confined to the eye dots:
      // that is a few dozen circles, where splitting the whole figure would
      // mean drawing every dot three times on every glitch frame.
      if (glitching) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.5;
        for (const [ox, col] of [
          [-glitchSplit, colFringeA],
          [glitchSplit, colFringeB],
        ] as const) {
          ctx.fillStyle = col;
          for (const dot of dots) {
            if (dot.tier !== 3) continue;
            ctx.beginPath();
            ctx.arc(dot.tx + ox, dot.y, Math.max(0.5, dot.dr * 0.85), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // Sparks last, so they read as being in front of the portrait.
      const sparks = sparksRef.current;
      if (!snap && sparks.length) {
        ctx.save();
        ctx.fillStyle = colLit;
        ctx.shadowColor = colLit;
        ctx.shadowBlur = glow;
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          const age = now - s.born;
          if (age > s.life) {
            sparks.splice(i, 1);
            continue;
          }
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.94;
          s.vy *= 0.94;
          const k = 1 - age / s.life;
          ctx.globalAlpha = k * 0.9;
          ctx.beginPath();
          ctx.arc(s.x, s.y, Math.max(0.5, dotR * 0.5 * k), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // CRT scanlines, drifting slowly down the finished frame.
      //
      // Erased out with destination-out rather than painted on in black. The
      // canvas is transparent, so black bands would tint the page showing
      // through the avatar — obvious against the light theme, and wrong even on
      // the dark one, where they would sit *over* the glow instead of cutting
      // it. Erasing takes the dots and their glow away together, which is what
      // a scanline gap actually does.
      if (!snap) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.2;
        const period = Math.max(3, dotR * 2.4);
        const offset = ((t * 14) % period) - period;
        for (let y = -size + offset; y < size; y += period) {
          ctx.fillRect(-size, y, size * 2, period * 0.3);
        }
        ctx.restore();
      }
    }

    function loop(now: number) {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      draw(now);
    }

    // The loop may only run when the avatar is BOTH on screen and in a visible
    // tab. Two independent observers report those conditions, so each stores its
    // own flag and defers the decision to sync(). If they each called start()
    // directly, restoring a hidden tab would resume animating an avatar that is
    // scrolled far out of view.
    let onScreen = true;
    let tabVisible = !document.hidden;

    function sync() {
      const shouldRun = onScreen && tabVisible && !prefersReducedMotion;
      if (shouldRun && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    const paintStatic = () => draw(performance.now(), true);
    repaintRef.current = paintStatic;

    readColors();
    build();
    if (prefersReducedMotion) paintStatic();
    else sync();

    const ro = new ResizeObserver(() => {
      build();
      if (prefersReducedMotion) paintStatic();
    });
    ro.observe(host);

    // Theme flips toggle a class on <html>.
    const mo = new MutationObserver(() => {
      readColors();
      if (prefersReducedMotion) paintStatic();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Don't burn battery animating a face nobody is looking at.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(host);

    const onVisibility = () => {
      tabVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Dragging the window to a display with a different pixel ratio changes the
    // backing-store size the canvas needs without changing its CSS size, so
    // ResizeObserver never fires and the dots would stay soft. A resolution
    // media query is the only thing that reports this, and it has to be re-armed
    // after each change because the query is specific to one ratio.
    let dprQuery: MediaQueryList | null = null;
    const onDprChange = () => {
      build();
      if (prefersReducedMotion) paintStatic();
      watchDpr();
    };
    function watchDpr() {
      dprQuery?.removeEventListener("change", onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener("change", onDprChange);
    }
    watchDpr();

    // Bound to the window, not the tile. Touch pointers are ignored so phones
    // keep the idle wander — a finger drag is a scroll, not something to stare
    // at, and tracking it would make the face lurch on every swipe.
    const onWindowPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    // A null relatedTarget means the cursor left the document altogether,
    // rather than merely crossing between two elements inside it.
    const onWindowPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) pointerRef.current = { ...pointerRef.current, active: false };
    };
    const onWindowBlur = () => {
      pointerRef.current = { ...pointerRef.current, active: false };
    };
    window.addEventListener("pointermove", onWindowPointer, { passive: true });
    window.addEventListener("pointerout", onWindowPointerOut, { passive: true });
    window.addEventListener("blur", onWindowBlur);

    return () => {
      stop();
      repaintRef.current = null;
      ro.disconnect();
      mo.disconnect();
      io.disconnect();
      dprQuery?.removeEventListener("change", onDprChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onWindowPointer);
      window.removeEventListener("pointerout", onWindowPointerOut);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [prefersReducedMotion]);

  const mood = MOOD_ORDER[moodIndex];
  const unlocked = UNLOCKS[level];

  let hint: string;
  if (leveled) hint = unlocked ? `// LVL ${level} · ${unlocked}` : `// LVL ${level} unlocked`;
  else if (combo > 1) hint = `// x${combo} combo`;
  else if (touched) hint = `// ${MOOD_LABEL[mood]} · lvl ${level}`;
  else hint = "// poke me";

  return (
    <div className={`group relative ${className}`}>
      {/* No panel, border or fill on the control. The portrait should read as
          light hanging in the page rather than an avatar in a frame, and a card
          around it undoes the edge fade the lattice goes to the trouble of
          producing. The focus ring stays — it is the only thing that tells a
          keyboard user this is a control. */}
      <button
        type="button"
        ref={hostRef}
        onClick={poke}
        aria-label={`${label} — animated dot-matrix avatar of a hooded figure with glowing eyes, level ${level}. Activate to change its expression.`}
        className={`relative w-full h-full rounded-2xl cursor-pointer transition-transform duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          leveled ? "scale-[1.03]" : ""
        }`}
      >
        <canvas ref={canvasRef} className="block w-full h-full" aria-hidden="true" />

        {/* Level pip. Only after the first poke — an untouched portrait showing
            "LVL 1" invites a question the page shouldn't have to answer. */}
        {touched && (
          <span
            className={`pointer-events-none absolute top-2 right-2 font-mono text-[9px] font-semibold leading-none tracking-wider px-1.5 py-1 rounded-md border transition-colors duration-300 ${
              leveled
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background/85 text-foreground border-border backdrop-blur-sm"
            }`}
            aria-hidden="true"
          >
            {/* A bare numeral in the corner just looks like stray debris — it
                needs the unit to read as a level. */}
            LV{level}
          </span>
        )}
      </button>

      {/* Sits outside the tile so it can never nudge the hero's layout. */}
      <div className="pointer-events-none absolute -bottom-6 inset-x-0 flex justify-center md:justify-end">
        <span
          aria-live="polite"
          className={`font-mono text-[10px] tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
            leveled || combo > 1
              ? "text-primary opacity-100 translate-y-0"
              : touched
                ? "text-muted-foreground opacity-100 translate-y-0"
                : // Hover reveals the hint on a mouse. Touch devices have no hover
                  // at all, so on those the hint is simply always on — otherwise
                  // the interaction would be invisible to most of this page's
                  // traffic, which arrives from a phone.
                  "text-muted-foreground opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0"
          }`}
        >
          {hint}
        </span>
      </div>
    </div>
  );
}
