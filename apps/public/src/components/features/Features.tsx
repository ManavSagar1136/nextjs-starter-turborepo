"use client";

import { useReducedMotion, motion } from "framer-motion";
import {
  Link2,
  BarChart3,
  Globe,
  Smartphone,
  Code2,
  GitBranch,
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

function MiniSparkline() {
  const bars = [35, 55, 45, 70, 60, 85, 72, 95, 80, 68, 90, 88];
  return (
    <div className="flex items-end gap-1 h-12 mt-3" aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-[2px]"
          style={{
            height: `${h}%`,
            background: i === 7
              ? "var(--mk-brand)"
              : `rgba(99,102,241,${0.2 + (i / bars.length) * 0.5})`,
          }}
        />
      ))}
    </div>
  );
}

function MiniMap() {
  return (
    <div
      className="mt-3 relative h-20 w-full overflow-hidden rounded-[var(--mk-radius-sm)]"
      aria-hidden="true"
      style={{ background: "var(--mk-bg-primary)" }}
    >
      {/* Simplified world-map dot grid */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-5 gap-1 p-2 opacity-40">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              background: [5, 14, 17, 22, 26, 35, 38, 43, 47, 52, 55].includes(i)
                ? "var(--mk-accent)"
                : "var(--mk-border-bright)",
              width: 4,
              height: 4,
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-2 left-2 text-[9px] font-semibold" style={{ color: "var(--mk-accent)" }}>
        US · EU · APAC active
      </div>
    </div>
  );
}

function DeviceIcons() {
  return (
    <div className="mt-3 flex items-center gap-3" aria-hidden="true">
      {[
        { label: "Mobile", pct: "62%" },
        { label: "Desktop", pct: "31%" },
        { label: "Tablet", pct: "7%" },
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

function ApiSnippet() {
  return (
    <div
      className="mt-3 rounded-[var(--mk-radius-sm)] p-3 font-mono text-[11px] leading-relaxed"
      style={{ background: "var(--mk-bg-primary)", color: "var(--mk-text-muted)" }}
      aria-hidden="true"
    >
      <span style={{ color: "var(--mk-accent)" }}>POST</span>{" "}
      <span style={{ color: "var(--mk-text-secondary)" }}>/api/links</span>
      {"\n"}
      <span style={{ color: "var(--mk-brand)" }}>{"{"}</span>
      {"\n  "}
      <span style={{ color: "var(--mk-text-secondary)" }}>&quot;url&quot;</span>
      {": "}
      <span style={{ color: "var(--mk-success)" }}>&quot;https://…&quot;</span>
      {"\n"}
      <span style={{ color: "var(--mk-brand)" }}>{"}"}</span>
    </div>
  );
}

function AbTestVisual() {
  return (
    <div className="mt-3 flex items-center gap-3" aria-hidden="true">
      {[
        { label: "Variant A", pct: 58, color: "var(--mk-brand)" },
        { label: "Variant B", pct: 42, color: "var(--mk-accent)" },
      ].map(({ label, pct, color }) => (
        <div key={label} className="flex-1">
          <div className="mb-1 flex justify-between text-[10px]" style={{ color: "var(--mk-text-muted)" }}>
            <span>{label}</span>
            <span style={{ color }}>{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--mk-bg-primary)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Feature data ──────────────────────────────────────────────────────────────

const FEATURES: BentoFeature[] = [
  {
    id: "core-links",
    label: "Core",
    title: "Smart Short Links",
    description:
      "Create branded short URLs in seconds. Custom slugs, QR codes, link expiry, and password protection — built for marketers who ship fast.",
    icon: Link2,
    visual: null, // large card — no extra visual needed, uses icon + text
    gridArea: "core",
  },
  {
    id: "analytics",
    label: "Analytics",
    title: "Real-time Click Intelligence",
    description:
      "Every click tracked. See where your audience comes from, what device they use, and which links convert best — in real time.",
    icon: BarChart3,
    visual: <MiniSparkline />,
    gridArea: "analytics",
  },
  {
    id: "geo-targeting",
    label: "Targeting",
    title: "Geo Routing",
    description:
      "Send visitors to different pages based on country or region. One link, localised destinations.",
    icon: Globe,
    visual: <MiniMap />,
    gridArea: "geo",
  },
  {
    id: "device-targeting",
    label: "Targeting",
    title: "Device Detection",
    description:
      "Route mobile users to your app store page, desktop users to your landing page. Automatically.",
    icon: Smartphone,
    visual: <DeviceIcons />,
    gridArea: "device",
  },
  {
    id: "api",
    label: "Developer",
    title: "Full REST API",
    description:
      "Integrate link creation and analytics into your stack with our clean REST API and official SDKs.",
    icon: Code2,
    visual: <ApiSnippet />,
    gridArea: "api",
  },
  {
    id: "ab-testing",
    label: "Optimisation",
    title: "A/B Split Testing",
    description:
      "Split traffic between multiple destinations and let data decide the winner. Set weights, track conversions, iterate fast.",
    icon: GitBranch,
    visual: <AbTestVisual />,
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
      style={{ background: "var(--mk-bg-secondary)" }}
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
          <span className="mk-eyebrow mb-3 block">Platform features</span>
          <h2
            id="features-heading"
            className="font-bold leading-tight"
            style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
          >
            Everything your links need to{" "}
            <span className="mk-gradient-text">perform.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[560px] leading-relaxed"
            style={{ fontSize: "var(--mk-text-base)", color: "var(--mk-text-secondary)" }}
          >
            From smart routing to deep analytics — MakeTiny gives you the tools
            to turn every link into a revenue opportunity.
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
                "ab      ab      ab";
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
