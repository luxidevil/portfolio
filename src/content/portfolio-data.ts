/**
 * Single source of truth for every piece of content on the portfolio.
 * Everything here is derived from the owner's real GitHub account (@luxidevil).
 *
 * EDIT THIS FILE to change any text on the site — no component changes needed.
 */

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  category: ProjectCategory;
  repo?: string;
  liveUrl?: string;
  featured: boolean;
  /** Rough scale signal, used for sorting/labels. */
  scale?: string;
};

export type ProjectCategory =
  | "SaaS Platform"
  | "Developer Tool"
  | "AI"
  | "Commerce"
  | "Fintech"
  | "Infrastructure"
  | "Product";

/* ------------------------------------------------------------------ */
/* IDENTITY — change these three blocks to update the whole site       */
/* ------------------------------------------------------------------ */

/**
 * Resolve a file that lives in `public/` against the site's base path, so
 * assets keep working whether the site is served from "/" or a sub-path.
 * Absolute URLs are passed through untouched.
 */
export function asset(path: string): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export const profile = {
  name: "Kushal Gupta",
  handle: "luxidevil",
  /** Short role line under the name. */
  role: "Full-Stack Developer",
  /** One-line positioning statement, used in the hero. */
  headline: "I build and ship production systems end to end.",
  /** Bio paragraphs for the hero. */
  bio: [
    "Full-stack developer with 4+ years building production software — Python and Django on the backend, React on the front, and the database work in between. At LTIMindtree I ship APIs and services used by 50,000+ customers.",
    "I care about the parts that only show up under load: eliminating N+1 queries, indexing properly, paginating server-side, and keeping services observable. Outside work I build and self-host my own products end to end, from an empty repo to a domain serving live traffic over HTTPS.",
    "Currently expanding into AI and LLM application development — agent workflows and persistent memory infrastructure for agents.",
  ],
  location: "Thane, Maharashtra",
  /**
   * Leave empty to show the animated dot-matrix portrait (see
   * `components/dot-avatar.tsx`).
   * To use a real photo instead: drop the file in `public/` (e.g.
   * public/avatar.jpg) and set this to "avatar.jpg" — it is resolved against
   * the site base path. Setting a photo replaces the dot portrait entirely.
   */
  avatarUrl: "" as string,
  email: "kushalguptait@gmail.com",
  githubUrl: "https://github.com/luxidevil",
  siteUrl: "https://luxidevil.site",
  /** Optional — leave empty string to hide the link. */
  linkedinUrl: "https://www.linkedin.com/in/kushal-gupta-77949118a",
  twitterUrl: "",
  /** Served from public/resume.pdf — resolved via asset(). */
  resumeUrl: "resume.pdf",
  availableForWork: true,
} as const;

/* ------------------------------------------------------------------ */
/* EXPERIENCE                                                          */
/* ------------------------------------------------------------------ */

export type ExperienceEntry = {
  company: string;
  role: string;
  location: string;
  period: string;
  current?: boolean;
  bullets: string[];
};

export const experience: ExperienceEntry[] = [
  {
    company: "LTIMindtree",
    role: "Software Engineer",
    location: "Thane, Maharashtra",
    period: "May 2022 — Present",
    current: true,
    bullets: [
      "Designed and shipped a high-throughput report download API in Python serving 50,000+ customers — the key consumer-facing full-stack deliverable.",
      "Refactored Oracle DB SQL: eliminated N+1 patterns and restructured indexes, reducing application load time by 46%.",
      "Architected an event-driven notification microservice in Python for real-time email alerts, cutting issue resolution time by 30%.",
      "Built RESTful APIs for Last Sale Date and Event Management on a clean layered architecture, cutting decision-making time by 40%.",
      "Implemented server-side pagination, sorting and search, improving page load by 18% at scale.",
      "Enforced auth and encryption compliance and led team access control via ServiceNow, reducing system downtime by 20%.",
    ],
  },
  {
    company: "Labco Science, Inc.",
    role: "Full Stack Developer Intern",
    location: "Remote",
    period: "Sep 2020 — Dec 2020",
    bullets: [
      "Built a CRM with a full sales module — lead creation through opportunity, sale and invoice generation.",
      "Shipped task scheduler, calendar, notes and to-do modules, plus email sending from inside the app.",
      "Added file storage with data extraction, database export, activity logging and a personal assistant module.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* EDUCATION                                                           */
/* ------------------------------------------------------------------ */

export const education = {
  degree: "Bachelor of Engineering, Information Technology",
  school: "RCOEM, Nagpur",
  location: "Maharashtra",
  period: "2018 — 2022",
} as const;

/* ------------------------------------------------------------------ */
/* HEADLINE STATS — every figure is from real shipped work             */
/* ------------------------------------------------------------------ */

export const stats = [
  { label: "Years building production software", value: "4+" },
  { label: "Customers served by APIs I shipped", value: "50k+", accent: true },
  { label: "Faster application load time", value: "46%" },
  { label: "Faster issue resolution", value: "30%" },
] as const;

/* ------------------------------------------------------------------ */
/* PROJECTS                                                            */
/* ------------------------------------------------------------------ */

export const projects: Project[] = [
  {
    slug: "mailflow",
    name: "MailFlow",
    tagline: "Zero-DNS email sending platform",
    description:
      "An email delivery platform that removes the usual DNS setup burden — senders get working, authenticated delivery without touching SPF, DKIM or MX records themselves. Handles queueing, delivery pipelines and per-tenant sending.",
    stack: ["TypeScript", "Node.js", "Express", "SMTP", "PostgreSQL"],
    category: "SaaS Platform",
    repo: "https://github.com/luxidevil/mailflow",
    featured: true,
  },
  {
    slug: "ai-brain",
    name: "AI Brain",
    tagline: "Self-hosted memory API for AI agents",
    description:
      "A memory API that gives AI agents persistence across sessions — messages, planning steps, actions and logs stored in MongoDB, with a React dashboard that visualises a timeline of all agent activity. Built around a master 'Brain' token plus namespaced per-project 'Thought' keys, so every agent gets isolated memory and a scoped secrets vault. One sync endpoint persists everything an agent produces; a recall endpoint replays the timeline into a new session.",
    stack: ["React", "MongoDB", "REST API", "AI Agents"],
    category: "AI",
    repo: "https://github.com/luxidevil/ai-brain",
    featured: true,
  },
  {
    slug: "luxi-ide",
    name: "Luxi IDE",
    tagline: "AI-powered coding platform built on Gemini",
    description:
      "A browser-based development environment where an AI agent writes and edits code alongside you. Wraps Google Gemini with project context, file operations and a live preview loop.",
    stack: ["TypeScript", "React", "Google Gemini", "Vite"],
    category: "AI",
    repo: "https://github.com/luxidevil/google-ai-studio-vibe-coder",
    featured: true,
  },
  {
    slug: "har-analyzer",
    name: "HAR Analyzer",
    tagline: "Network trace analysis for debugging",
    description:
      "A developer tool that turns raw HAR captures into something readable: request waterfall, per-request inspection, and smart annotations that surface slow calls, redirect chains and failures without manual digging.",
    stack: ["TypeScript", "React", "Data Visualisation"],
    category: "Developer Tool",
    repo: "https://github.com/luxidevil/har-analyzer",
    featured: true,
  },
  {
    slug: "vouchervault",
    name: "VoucherVault",
    tagline: "Gift card marketplace for India",
    description:
      "A full marketplace for buying and reselling gift cards — catalogue, inventory, checkout and order flow. Built as a pnpm monorepo with a shared type-safe contract between the React frontend and Express API.",
    stack: ["TypeScript", "React", "Express", "pnpm monorepo", "PostgreSQL"],
    category: "Commerce",
    repo: "https://github.com/luxidevil/vouchervault",
    featured: true,
  },
  {
    slug: "verifypro",
    name: "VerifyPro",
    tagline: "Credits platform with on-chain USDT payments",
    description:
      "A credit-based platform where users top up with USDT on BEP20 and spend credits on identity verification services. Covers on-chain payment confirmation, credit ledgers and verification workflows.",
    stack: ["TypeScript", "Node.js", "Web3", "USDT BEP20", "PostgreSQL"],
    category: "Fintech",
    repo: "https://github.com/luxidevil/verifypro",
    featured: true,
  },
  {
    slug: "physio-app",
    name: "Physio",
    tagline: "Rehabilitation programme app",
    description:
      "A physiotherapy rehab application that guides patients through structured exercise programmes and tracks recovery progress over time. Shipped to its own domain.",
    stack: ["TypeScript", "React", "Node.js"],
    category: "Product",
    repo: "https://github.com/luxidevil/physio-app",
    liveUrl: "https://luxidevil.fit",
    featured: true,
  },
  // The next two entries are intentionally described without product names,
  // domains or live links. This is a settled decision by the owner — do NOT
  // add a `liveUrl`, restore real names, or use slugs that hint at a domain.
  {
    slug: "vendor-ops-portal",
    name: "Vendor Ops Portal",
    tagline: "Multi-service vendor portal, live in production",
    description:
      "A vendor portal serving live customers: an IMAP-backed retrieval pipeline pulls verification emails in real time, behind an admin panel with per-service access controls. Self-hosted on a hardened Ubuntu server with isolated system users, systemd services and per-domain TLS.",
    stack: ["TypeScript", "Express", "IMAP", "SQLite", "nginx", "systemd"],
    category: "SaaS Platform",
    featured: true,
    scale: "65k+ messages indexed",
  },
  {
    slug: "voucher-storefront",
    name: "Voucher Storefront",
    tagline: "Voucher validation and redemption, live in production",
    description:
      "A customer-facing voucher platform with code validation and redemption flows, deployed on self-managed infrastructure with HTTPS, process isolation and automated certificate renewal.",
    stack: ["TypeScript", "React", "Express", "nginx"],
    category: "Commerce",
    featured: true,
  },
  {
    slug: "dealer-dxb",
    name: "Dealer DXB Dashboard",
    tagline: "Reseller operations dashboard",
    description:
      "An operations dashboard for a reseller network — account management, order handling and service automation, split into an Express API with a React frontend and several standalone microservices.",
    stack: ["TypeScript", "React", "Express", "Microservices"],
    category: "SaaS Platform",
    repo: "https://github.com/luxidevil/dealer-dxb-dashboard",
    featured: false,
  },
  {
    slug: "inventory-manager",
    name: "Bulk Inventory Manager",
    tagline: "Chain-based inventory resale platform",
    description:
      "Bulk inventory tooling for a resale business: chained ownership records, bulk import and assignment, and an admin surface for tracking stock as it moves through the chain.",
    stack: ["TypeScript", "React", "Node.js"],
    category: "Commerce",
    repo: "https://github.com/luxidevil/inventory-manager-for-admin",
    featured: false,
  },
  {
    slug: "marketplace",
    name: "GenZ Marketplace",
    tagline: "Digital goods marketplace",
    description:
      "An e-commerce marketplace for OTT subscriptions, game keys and digital goods, with catalogue, cart and order management.",
    stack: ["TypeScript", "React", "Express"],
    category: "Commerce",
    repo: "https://github.com/luxidevil/marketplace",
    featured: false,
  },
  {
    slug: "receipt-crm",
    name: "Receipt CRM",
    tagline: "Payment proof and task tracking",
    description:
      "An internal CRM for reconciling payment proofs against tasks — upload, verification state, and an audit trail of who actioned what.",
    stack: ["TypeScript", "React", "Node.js"],
    category: "Product",
    repo: "https://github.com/luxidevil/payment-proof-manager",
    featured: false,
  },
  {
    slug: "checkout-kiosk",
    name: "Checkout Kiosk",
    tagline: "Self-service checkout server",
    description:
      "A kiosk-mode checkout server handling in-person order capture and payment confirmation.",
    stack: ["JavaScript", "Node.js", "Express"],
    category: "Commerce",
    repo: "https://github.com/luxidevil/checkout-kiosk",
    featured: false,
  },
  {
    slug: "worm-marketplace",
    name: "Worm Marketplace",
    tagline: "Niche e-commerce storefront",
    description:
      "A complete e-commerce template built for selling composting worms and gardening supplies — product catalogue, cart and checkout.",
    stack: ["TypeScript", "React", "E-commerce"],
    category: "Commerce",
    repo: "https://github.com/luxidevil/worm-marketplace",
    featured: false,
  },
  {
    slug: "valentine-card-creator",
    name: "Card Creator",
    tagline: "AI-generated personalised cards",
    description:
      "A playful generator that writes and designs personalised cards and letters from a few prompts, with AI-assisted copy and shareable output.",
    stack: ["JavaScript", "AI", "React"],
    category: "AI",
    repo: "https://github.com/luxidevil/valentine-card-creator",
    featured: false,
  },
  {
    slug: "algo-healer",
    name: "Algo Healer",
    tagline: "Algorithmic trading toolkit",
    description:
      "Tooling around algorithmic strategy analysis — candle pattern detection and pair filtering across market data feeds.",
    stack: ["TypeScript", "Node.js", "Market Data"],
    category: "Developer Tool",
    repo: "https://github.com/luxidevil/Algo-Healer",
    featured: false,
  },
  {
    slug: "luxidevilott",
    name: "luxidevilott",
    tagline: "Disposable email across 200+ domains",
    description:
      "A temporary email service running on self-hosted mail infrastructure spread across 200+ domains, so anyone can spin up a throwaway inbox on demand.",
    stack: ["Mail infrastructure", "Node.js", "Linux"],
    category: "Infrastructure",
    featured: false,
    scale: "200+ domains",
  },
  {
    slug: "omkaksha",
    name: "OMkaksha",
    tagline: "Free GRE preparation platform",
    description:
      "A GRE prep site built with my brother where candidates can sit practice tests and prepare for free.",
    stack: ["JavaScript", "Web"],
    category: "Product",
    featured: false,
  },
];

/* ------------------------------------------------------------------ */
/* SKILLS — grouped by discipline                                      */
/* ------------------------------------------------------------------ */

export const skillGroups = [
  {
    title: "Languages",
    items: ["Python", "JavaScript", "TypeScript", "Golang", "SQL"],
  },
  {
    title: "Backend & APIs",
    items: [
      "Django",
      "REST API design",
      "Microservices",
      "Event-driven architecture",
      "Node.js / Express",
    ],
  },
  {
    title: "Frontend",
    items: [
      "React",
      "Component architecture",
      "Responsive UI",
      "REST API integration",
      "Tailwind CSS",
    ],
  },
  {
    title: "AI & LLM",
    items: [
      "LLM application development",
      "Agent workflows",
      "LangChain patterns",
      "Gemini & Claude APIs",
    ],
  },
  {
    title: "Databases",
    items: [
      "PostgreSQL",
      "Oracle DB",
      "MongoDB",
      "SQL optimisation (N+1, indexing)",
      "Schema design",
    ],
  },
  {
    title: "Infrastructure",
    items: [
      "Linux (Ubuntu)",
      "nginx",
      "systemd",
      "Let's Encrypt / TLS",
      "DigitalOcean",
      "Git",
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/* WHAT I DO — three capability pillars                                */
/* ------------------------------------------------------------------ */

export const pillars = [
  {
    title: "Backend & APIs",
    body: "Python and Django services, REST API design, microservices and event-driven architecture — including a report API serving 50,000+ customers, and Oracle SQL work that cut load time by 46%.",
  },
  {
    title: "Full-stack product",
    body: "React frontends on top of my own APIs: marketplaces, dashboards, CRMs and customer portals, built from database schema all the way through to interface.",
  },
  {
    title: "Ship & operate",
    body: "I don't stop at the repo. Provisioning Linux servers, nginx routing, TLS, service isolation and repeatable deploys are part of how I work.",
  },
] as const;

export const projectCategories: ProjectCategory[] = [
  "SaaS Platform",
  "Commerce",
  "AI",
  "Developer Tool",
  "Fintech",
  "Infrastructure",
  "Product",
];
