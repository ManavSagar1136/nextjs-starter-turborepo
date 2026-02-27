"use client";

import { useReducedMotion, motion } from "framer-motion";
import {
  Database,
  BarChart3,
  Globe,
  Shield,
  Code2,
  Layers,
} from "lucide-react";

import {
  getMotionVariant,
  fadeUp,
  staggerContainer,
  bentoCard,
} from "@/lib/animation-variants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BentoFeature {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: React.ElementType;
  visual: React.ReactNode;
  /** CSS grid-area for desktop bento layout */
  gridArea: string;
}

// ─── Visual accents (decorative, aria-hidden) ─────────────────────────────────

function ContentTypeVisual() {
  return (
    <div className="mt-3 space-y-1.5" aria-hidden="true">
      {[
        { name: "BlogPost", fields: 8, color: "var(--mk-brand)" },
        { name: "Page", fields: 5, color: "var(--mk-accent)" },
        { name: "Product", fields: 12, color: "var(--mk-success)" },
      ].map(({ name, fields, color }) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-[var(--mk-radius-sm)] px-3 py-1.5"
          style={{ background: "var(--mk-bg-primary)" }}
        >
          <span className="text-xs font-medium" style={{ color }}>{name}</span>
          <span className="text-[10px]" style={{ color: "var(--mk-text-muted)" }}>{fields} fields</span>
        </div>
      ))}
    </div>
  );
}

function ApiSnippet() {
  return (
    <div
      className="mt-3 whitespace-pre rounded-[var(--mk-radius-sm)] p-3 font-mono text-[11px] leading-relaxed"
      style={{ background: "var(--mk-bg-primary)", color: "var(--mk-text-muted)" }}
      aria-hidden="true"
    >
      <span style={{ color: "var(--mk-accent)" }}>GET</span>{" "}
      <span style={{ color: "var(--mk-text-secondary)" }}>/api/posts</span>
      {"\n"}
      <span style={{ color: "var(--mk-brand)" }}>{"{"}</span>
      {"\n  "}
      <span style={{ color: "var(--mk-text-secondary)" }}>&quot;data&quot;</span>
      {": ["}
      <span style={{ color: "var(--mk-success)" }}>...</span>
      {"]"}
      {"\n"}
      <span style={{ color: "var(--mk-brand)" }}>{"}"}</span>
    </div>
  );
}

function RoleVisual() {
  return (
    <div className="mt-3 flex items-center gap-3" aria-hidden="true">
      {[
        { label: "Admin", pct: "Full" },
        { label: "Editor", pct: "Write" },
        { label: "Viewer", pct: "Read" },
      ].map(({ label, pct }) => (
        <div
          key={label}
          className="flex-1 rounded-[var(--mk-radius-sm)] p-2 text-center"
          style={{ background: "var(--mk-bg-primary)" }}
        >
          <p className="text-xs font-bold" style={{ color: "var(--mk-brand)" }}>{pct}</p>
          <p className="text-[10px]" style={{ color: "var(--mk-text-muted)" }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function MultiAppVisual() {
  return (
    <div className="mt-3 flex items-center gap-3" aria-hidden="true">
      {[
        { label: "Public", color: "#6366F1" },
        { label: "Admin", color: "#06B6D4" },
        { label: "User", color: "#10B981" },
        { label: "Docs", color: "#F59E0B" },
      ].map(({ label, color }) => (
        <div
          key={label}
          className="flex-1 rounded-[var(--mk-radius-sm)] border p-2 text-center"
          style={{ borderColor: `${color}33` }}
        >
          <div className="mx-auto mb-1 h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          <p className="text-[10px]" style={{ color: "var(--mk-text-muted)" }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Feature data ──────────────────────────────────────────────────────────────

const FEATURES: BentoFeature[] = [
  {
    id: "headless-cms",
    label: "Core",
    title: "Headless CMS",
    description:
      "A full content management system with admin dashboard, content editor, media library, and publishing workflow — out of the box.",
    icon: Database,
    visual: null,
    gridArea: "core",
  },
  {
    id: "content-modeling",
    label: "Content",
    title: "Content Modeling",
    description:
      "Define any content type with Prisma schemas. Blog posts, docs, pages, products — type-safe from database to frontend.",
    icon: BarChart3,
    visual: <ContentTypeVisual />,
    gridArea: "analytics",
  },
  {
    id: "api-first",
    label: "Developer",
    title: "API-First Architecture",
    description:
      "Every content type gets a type-safe API automatically. REST endpoints with full CRUD, filtering, and pagination.",
    icon: Code2,
    visual: <ApiSnippet />,
    gridArea: "geo",
  },
  {
    id: "multi-app",
    label: "Architecture",
    title: "Multi-App Monorepo",
    description:
      "Public site, admin dashboard, user portal, and docs — all in one repo with shared packages and types.",
    icon: Layers,
    visual: <MultiAppVisual />,
    gridArea: "device",
  },
  {
    id: "rbac",
    label: "Security",
    title: "Role-Based Access",
    description:
      "Built-in RBAC with admin, editor, and viewer roles. Granular permissions for content management and user access.",
    icon: Shield,
    visual: <RoleVisual />,
    gridArea: "api",
  },
  {
    id: "deploy",
    label: "Deployment",
    title: "Edge-Ready Deployment",
    description:
      "Optimized for Vercel with zero-config deployment. Docker support for self-hosting. ISR, SSR, and static generation built in.",
    icon: Globe,
    visual: null,
    gridArea: "ab",
  },
];

// ─── Bento card ───────────────────────────────────────────────────────────────

interface BentoCardProps {
  feature: BentoFeature;
  shouldReduce: boolean | null;
}

function BentoCard({ feature, shouldReduce }: BentoCardProps) {
  const Icon = feature.icon;
  const cardVariant = getMotionVariant(shouldReduce, bentoCard);

  return (
    <motion.article
      variants={cardVariant}
      className="mk-card group flex flex-col p-5"
      style={{ "--grid-area": feature.gridArea } as React.CSSProperties}
      aria-label={feature.title}
    >
      {/* Icon */}
      <div
        className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-[var(--mk-radius-sm)]"
        style={{ background: "var(--mk-brand-muted)" }}
        aria-hidden="true"
      >
        <Icon size={18} style={{ color: "var(--mk-brand)" }} strokeWidth={1.5} />
      </div>

      {/* Label */}
      <span className="mk-eyebrow mb-1">{feature.label}</span>

      {/* Title */}
      <h3
        className="font-semibold leading-snug"
        style={{ fontSize: "var(--mk-text-xl)", color: "var(--mk-text-primary)" }}
      >
        {feature.title}
      </h3>

      {/* Description */}
      <p
        className="mt-2 leading-relaxed"
        style={{ fontSize: "var(--mk-text-sm)", color: "var(--mk-text-secondary)" }}
      >
        {feature.description}
      </p>

      {/* Visual accent */}
      {feature.visual && <div className="mt-auto pt-2">{feature.visual}</div>}
    </motion.article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type FeaturesProps = {
  showCta?: boolean;
};

export const Features = ({ showCta: _showCta = true }: FeaturesProps) => {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);
  const containerVariant = getMotionVariant(shouldReduce, staggerContainer);

  return (
    <section
      id="features"
      className="w-full py-[var(--mk-section-y)] px-[var(--mk-section-x)]"
      style={{ background: "var(--mk-bg-primary)" }}
      aria-labelledby="features-heading"
    >
      <div className="mx-auto w-full max-w-[1280px]">

        {/* Section header */}
        <motion.div
          variants={headlineVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12 text-center"
        >
          <span className="mk-eyebrow mb-3 block">Platform Features</span>
          <h2
            id="features-heading"
            className="font-bold leading-tight"
            style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
          >
            Everything your CMS needs to{" "}
            <span className="mk-gradient-text">scale.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[560px] leading-relaxed"
            style={{ fontSize: "var(--mk-text-base)", color: "var(--mk-text-secondary)" }}
          >
            From content modeling to multi-app deployment — a complete CMS
            platform built for developer teams.
          </p>
        </motion.div>

        {/* Bento grid — desktop uses named grid areas, mobile stacks to 1 col */}
        <style>{`
          .mk-bento-grid {
            display: grid;
            gap: 1rem;
            grid-template-columns: 1fr;
          }
          .mk-bento-grid > * { grid-area: unset; }

          @media (min-width: 768px) {
            .mk-bento-grid {
              grid-template-columns: 1fr 1fr 1fr;
              grid-template-areas:
                "core    core    analytics"
                "geo     device  analytics"
                "api     api     ab";
            }
            .mk-bento-grid > * { grid-area: var(--grid-area); }
          }
        `}</style>

        <motion.div
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mk-bento-grid"
        >
          {FEATURES.map((feature) => (
            <BentoCard key={feature.id} feature={feature} shouldReduce={shouldReduce} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
