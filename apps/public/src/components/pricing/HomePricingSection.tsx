"use client";

import { motion, useReducedMotion } from "framer-motion";

import { getMotionVariant, fadeUp } from "@/lib/animation-variants";

import { PublicPricingProvider } from "./PublicPricingProvider";
import { PublicPricing } from "./PublicPricing";

export function HomePricingSection() {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);

  return (
    <section
      id="pricing"
      className="w-full py-[var(--mk-section-y)] px-[var(--mk-section-x)]"
      style={{ background: "var(--mk-bg-primary)" }}
      aria-labelledby="pricing-heading"
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
          <span className="mk-eyebrow mb-3 block">Pricing</span>
          <h2
            id="pricing-heading"
            className="font-bold leading-tight"
            style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
          >
            Simple pricing. <span className="mk-gradient-text">No surprises.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[480px] leading-relaxed"
            style={{ fontSize: "var(--mk-text-base)", color: "var(--mk-text-secondary)" }}
          >
            Start free and scale as you grow. Upgrade, downgrade, or cancel anytime.
          </p>
        </motion.div>

        {/* Plans */}
        <PublicPricingProvider>
          <PublicPricing />
        </PublicPricingProvider>
      </div>
    </section>
  );
}
