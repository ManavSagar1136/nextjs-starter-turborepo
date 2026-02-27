/**
 * Landing page content constants
 * All text content for the public marketing site sections
 */

// ─── Stats Bar ──────────────────────────────────────────────────────────────

export const STATS = [
  { label: "Content Types", value: 12, suffix: "+" },
  { label: "API Routes", value: 50, suffix: "+" },
  { label: "Packages", value: 20, suffix: "+" },
  { label: "Integrations", value: 15, suffix: "+" },
] as const;

// ─── Architecture ──────────────────────────────────────────────────────────

export interface ArchNode {
  name: string;
  description: string;
  color: string;
}

export const ARCH_APPS: ArchNode[] = [
  { name: "public", description: "Marketing & Blog", color: "#6366F1" },
  { name: "admin", description: "CMS Dashboard", color: "#06B6D4" },
  { name: "user", description: "User Portal", color: "#10B981" },
  { name: "docs", description: "Documentation", color: "#F59E0B" },
  { name: "video", description: "Media Processing", color: "#EC4899" },
];

export const ARCH_PACKAGES: ArchNode[] = [
  { name: "ui", description: "Shared Components", color: "#6366F1" },
  { name: "database", description: "Prisma + Models", color: "#06B6D4" },
  { name: "tailwind-config", description: "Shared Styles", color: "#10B981" },
  { name: "utils", description: "Shared Utilities", color: "#F59E0B" },
  { name: "components", description: "Business Components", color: "#EC4899" },
  { name: "email", description: "Email Templates", color: "#8B5CF6" },
  { name: "storage", description: "File Storage", color: "#14B8A6" },
  { name: "env", description: "Environment Config", color: "#F97316" },
];

// ─── Tech Stack ─────────────────────────────────────────────────────────────

export interface TechItem {
  name: string;
  category: string;
}

export const TECH_CATEGORIES = [
  "Framework",
  "Database",
  "Styling",
  "Auth",
  "Deployment",
  "Tools",
] as const;

export const TECH_STACK: TechItem[] = [
  { name: "Next.js 15", category: "Framework" },
  { name: "React 19", category: "Framework" },
  { name: "TypeScript", category: "Framework" },
  { name: "Turborepo", category: "Framework" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Prisma ORM", category: "Database" },
  { name: "Redis", category: "Database" },
  { name: "Tailwind CSS", category: "Styling" },
  { name: "shadcn/ui", category: "Styling" },
  { name: "Framer Motion", category: "Styling" },
  { name: "NextAuth.js", category: "Auth" },
  { name: "RBAC", category: "Auth" },
  { name: "Vercel", category: "Deployment" },
  { name: "Docker", category: "Deployment" },
  { name: "ESLint", category: "Tools" },
  { name: "Prettier", category: "Tools" },
  { name: "Husky", category: "Tools" },
  { name: "Vitest", category: "Tools" },
];

// ─── How It Works ───────────────────────────────────────────────────────────

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Clone & Install",
    description:
      "Clone the monorepo, run a single install command, and you're ready to go. All packages and apps are linked automatically via Turborepo.",
    code: "npx create-cms-app my-project",
  },
  {
    step: 2,
    title: "Define Content Models",
    description:
      "Create your content types using Prisma schemas. Blog posts, pages, products — whatever your CMS needs. Type-safe from database to frontend.",
    code: "npx prisma db push",
  },
  {
    step: 3,
    title: "Deploy & Publish",
    description:
      "Deploy to Vercel with zero config. Your admin dashboard, public site, docs, and user portal — all deployed and connected automatically.",
    code: "vercel deploy",
  },
] as const;

// ─── Code Preview ───────────────────────────────────────────────────────────

export const CODE_PREVIEW = `// prisma/schema.prisma

model BlogPost {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String   @db.Text
  excerpt     String?
  coverImage  String?
  published   Boolean  @default(false)
  publishedAt DateTime?
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
  tags        Tag[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id    String     @id @default(cuid())
  name  String     @unique
  slug  String     @unique
  posts BlogPost[]
}`;

// ─── Comparison Table ───────────────────────────────────────────────────────

export interface ComparisonFeature {
  feature: string;
  cmsMonorepo: boolean | string;
  contentful: boolean | string;
  strapi: boolean | string;
  wordpress: boolean | string;
}

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  { feature: "Self-hosted", cmsMonorepo: true, contentful: false, strapi: true, wordpress: true },
  { feature: "Open Source", cmsMonorepo: true, contentful: false, strapi: true, wordpress: true },
  { feature: "Type-safe API", cmsMonorepo: true, contentful: false, strapi: false, wordpress: false },
  { feature: "Monorepo Architecture", cmsMonorepo: true, contentful: false, strapi: false, wordpress: false },
  { feature: "Built-in Auth (RBAC)", cmsMonorepo: true, contentful: true, strapi: true, wordpress: true },
  { feature: "Multi-app Support", cmsMonorepo: true, contentful: false, strapi: false, wordpress: false },
  { feature: "API-first / Headless", cmsMonorepo: true, contentful: true, strapi: true, wordpress: "Plugin" },
  { feature: "Real-time Preview", cmsMonorepo: true, contentful: true, strapi: "Plugin", wordpress: "Plugin" },
  { feature: "Built-in Blog Engine", cmsMonorepo: true, contentful: false, strapi: false, wordpress: true },
  { feature: "Built-in Docs Site", cmsMonorepo: true, contentful: false, strapi: false, wordpress: false },
  { feature: "Edge-ready (Vercel)", cmsMonorepo: true, contentful: true, strapi: false, wordpress: false },
  { feature: "No vendor lock-in", cmsMonorepo: true, contentful: false, strapi: true, wordpress: true },
];

export const COMPARISON_HEADERS = [
  { key: "cmsMonorepo", label: "BuildBase NextJS Starter", highlight: true },
  { key: "contentful", label: "Contentful", highlight: false },
  { key: "strapi", label: "Strapi", highlight: false },
  { key: "wordpress", label: "WordPress", highlight: false },
] as const;

// ─── Testimonials (CMS-specific) ────────────────────────────────────────────

export const CMS_TESTIMONIALS = [
  {
    text: "We migrated from WordPress to this CMS monorepo and our deployment time went from 20 minutes to under 2. The type-safe API layer alone saved us weeks of debugging.",
    name: "Alex Thompson",
    job: "Head of Engineering at CloudNest",
    company: "CloudNest",
    highlightSentences: ["deployment time went from 20 minutes to under 2"],
  },
  {
    text: "The monorepo architecture is a game-changer. Our admin dashboard, public site, and docs all share components and types — no more copy-pasting between repos.",
    name: "Priya Sharma",
    job: "Director of Engineering at ScaleOps",
    company: "ScaleOps",
    highlightSentences: ["share components and types"],
  },
  {
    text: "We evaluated Contentful, Strapi, and Sanity. This template gave us more control, better developer experience, and zero monthly fees. It was an easy choice.",
    name: "Michael Chen",
    job: "CTO at NovaTech",
    company: "NovaTech",
    highlightSentences: ["more control, better developer experience, and zero monthly fees"],
  },
  {
    text: "Setting up a multi-tenant CMS used to take months. With this template, we had a working prototype in a weekend. The Prisma + Next.js combination is incredibly productive.",
    name: "Sarah Williams",
    job: "VP of Product at Elevate Labs",
    company: "Elevate Labs",
    highlightSentences: ["working prototype in a weekend"],
  },
];
