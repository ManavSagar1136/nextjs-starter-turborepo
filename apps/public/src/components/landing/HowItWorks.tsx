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
      className="w-full py-20 md:py-32 px-5 md:px-20 bg-slate-50 dark:bg-dark-surface-secondary"
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
            className="font-bold leading-tight text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
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
            className="absolute top-12 left-[16.66%] right-[16.66%] hidden h-px md:block bg-slate-300 dark:bg-slate-700"
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
                className="mb-6 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white bg-indigo-500"
              >
                {step.step}
              </div>

              {/* Title */}
              <h3
                className="mb-3 font-semibold text-xl md:text-2xl text-slate-900 dark:text-slate-50"
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="mb-4 max-w-[320px] leading-relaxed text-sm text-slate-600 dark:text-slate-400"
              >
                {step.description}
              </p>

              {/* Code snippet */}
              <code
                className="rounded-lg px-4 py-2 font-mono text-sm bg-white dark:bg-dark-surface text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-800"
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
