"use client";

import { motion, useReducedMotion } from "framer-motion";

import { HOW_IT_WORKS_STEPS } from "@/data/landing";
import { getMotionVariant, fadeUp, stepContainer, stepItem } from "@/lib/animation-variants";

export function HowItWorks() {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);
  const containerVariant = getMotionVariant(shouldReduce, stepContainer);
  const itemVariant = getMotionVariant(shouldReduce, stepItem);

  return (
    <section
      id="how-it-works"
      className="w-full py-[var(--mk-section-y)] px-[var(--mk-section-x)]"
      style={{ background: "var(--mk-bg-secondary)" }}
      aria-labelledby="how-heading"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        {/* Header */}
        <motion.div
          variants={headlineVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <span className="mk-eyebrow mb-3 block">How It Works</span>
          <h2
            id="how-heading"
            className="font-bold leading-tight"
            style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
          >
            Up and running in <span className="mk-gradient-text">3 steps.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative mx-auto grid max-w-[1000px] gap-8 md:grid-cols-3"
        >
          {/* Connector line (desktop only) */}
          <div
            className="absolute top-12 left-[16.66%] right-[16.66%] hidden h-px md:block"
            style={{ background: "var(--mk-border-bright)" }}
            aria-hidden="true"
          />

          {HOW_IT_WORKS_STEPS.map((step) => (
            <motion.div
              key={step.step}
              variants={itemVariant}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <div
                className="mb-6 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: "var(--mk-brand)" }}
              >
                {step.step}
              </div>

              {/* Title */}
              <h3
                className="mb-3 font-semibold"
                style={{ fontSize: "var(--mk-text-xl)", color: "var(--mk-text-primary)" }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="mb-4 max-w-[320px] leading-relaxed"
                style={{ fontSize: "var(--mk-text-sm)", color: "var(--mk-text-secondary)" }}
              >
                {step.description}
              </p>

              {/* Code snippet */}
              <code
                className="rounded-[var(--mk-radius-sm)] px-4 py-2 font-mono text-sm"
                style={{
                  background: "var(--mk-bg-primary)",
                  color: "var(--mk-accent)",
                  border: "1px solid var(--mk-border)",
                }}
              >
                {step.code}
              </code>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
