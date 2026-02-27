"use client";

import { motion, useReducedMotion } from "framer-motion";

import { ARCH_APPS, ARCH_PACKAGES, type ArchNode } from "@/data/landing";
import { getMotionVariant, fadeUp, staggerContainer } from "@/lib/animation-variants";

function NodeBadge({ node }: { node: ArchNode }) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-[var(--mk-radius-md)] border px-4 py-3 text-center transition-all duration-200 hover:scale-105"
      style={{
        borderColor: `${node.color}33`,
        background: `${node.color}0D`,
      }}
    >
      <span
        className="text-sm font-bold"
        style={{ color: node.color }}
      >
        {node.name}
      </span>
      <span
        className="text-[11px]"
        style={{ color: "var(--mk-text-muted)" }}
      >
        {node.description}
      </span>
    </div>
  );
}

export function ArchitectureVisual() {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);
  const containerVariant = getMotionVariant(shouldReduce, staggerContainer);
  const itemVariant = getMotionVariant(shouldReduce, fadeUp);

  return (
    <section
      id="architecture"
      className="w-full py-[var(--mk-section-y)] px-[var(--mk-section-x)]"
      style={{ background: "var(--mk-bg-secondary)" }}
      aria-labelledby="arch-heading"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        {/* Header */}
        <motion.div
          variants={headlineVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12 text-center"
        >
          <span className="mk-eyebrow mb-3 block">Architecture</span>
          <h2
            id="arch-heading"
            className="font-bold leading-tight"
            style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
          >
            One monorepo. <span className="mk-gradient-text">Everything connected.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[560px] leading-relaxed"
            style={{ fontSize: "var(--mk-text-base)", color: "var(--mk-text-secondary)" }}
          >
            A Turborepo-powered monorepo with shared packages, multiple apps, and
            type-safe code from database to frontend.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mk-card mk-card-static mx-auto max-w-[900px] p-6 sm:p-10"
          style={{ background: "var(--mk-bg-secondary)" }}
        >
          {/* Apps row */}
          <motion.div variants={itemVariant}>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--mk-brand)" }} />
              <span className="mk-eyebrow">apps/</span>
            </div>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {ARCH_APPS.map((app) => (
                <NodeBadge key={app.name} node={app} />
              ))}
            </div>
          </motion.div>

          {/* Connector line */}
          <motion.div
            variants={itemVariant}
            className="mx-auto mb-8 h-8 w-px"
            style={{ background: "var(--mk-border-bright)" }}
            aria-hidden="true"
          />

          {/* Packages row */}
          <motion.div variants={itemVariant}>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--mk-accent)" }} />
              <span className="mk-eyebrow">packages/</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {ARCH_PACKAGES.map((pkg) => (
                <NodeBadge key={pkg.name} node={pkg} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
