# Portfolio

Source for [luxidevil.site](https://luxidevil.site) — a single-page developer
portfolio, built as a static site and self-hosted behind nginx.

## Stack

- React 19 + TypeScript, bundled with Vite
- Tailwind CSS v4, with a small set of Radix primitives
- Framer Motion for section reveals
- wouter for routing

No backend: the site is fully static, and all content lives in
`src/content/portfolio-data.ts`.

## Running it

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173.

```bash
pnpm build      # static output in dist/
pnpm preview    # serve the built output
pnpm typecheck
```

## Notable bits

- `src/components/dot-avatar.tsx` — the animated portrait, drawn on a canvas
  as a dot-matrix panel. Features are sampled against the dot lattice, and the
  gaze snaps to whole cells so the eyes stay symmetric.
- `src/components/game-hud.tsx` — a progressive-disclosure achievement layer.
  Hidden until you interact, so it never gets in the way of reading the page.
- `src/lib/use-reveal.ts` — scroll-reveal hook that respects
  `prefers-reduced-motion`.
