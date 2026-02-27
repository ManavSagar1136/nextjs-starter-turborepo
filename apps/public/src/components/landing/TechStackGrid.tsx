"use client";

import { motion, useReducedMotion } from "framer-motion";

import { TECH_STACK, TECH_CATEGORIES } from "@/data/landing";
import { getMotionVariant, fadeUp, staggerContainer } from "@/lib/animation-variants";

export function TechStackGrid() {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);
  const containerVariant = getMotionVariant(shouldReduce, staggerContainer);
  const itemVariant = getMotionVariant(shouldReduce, fadeUp);

  return (
    <section
      id="tech-stack"
      className="w-full py-[var(--mk-section-y)] px-[var(--mk-section-x)]"
      style={{ background: "var(--mk-bg-primary)" }}
      aria-labelledby="tech-heading"
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
          <span className="mk-eyebrow mb-3 block">Tech Stack</span>
          <h2
            id="tech-heading"
            className="font-bold leading-tight"
            style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
          >
            Built with <span className="mk-gradient-text">modern tools.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[560px] leading-relaxed"
            style={{ fontSize: "var(--mk-text-base)", color: "var(--mk-text-secondary)" }}
          >
            Industry-standard technologies you already know and love.
          </p>
        </motion.div>

        {/* Grid by category */}
        <motion.div
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto grid max-w-[900px] gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TECH_CATEGORIES.map((category) => {
            const items = TECH_STACK.filter((t) => t.category === category);
            return (
              <motion.div key={category} variants={itemVariant}>
                <h3
                  className="mk-eyebrow mb-3"
                  style={{ color: "var(--mk-accent)" }}
                >
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span
                      key={item.name}
                      className="rounded-[var(--mk-radius-full)] border px-3 py-1.5 text-sm font-medium transition-colors duration-200"
                      style={{
                        borderColor: "var(--mk-border)",
                        color: "var(--mk-text-secondary)",
                        background: "var(--mk-bg-elevated)",
                      }}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
