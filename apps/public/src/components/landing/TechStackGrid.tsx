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
      className="w-full py-20 md:py-32 px-5 md:px-20 bg-white dark:bg-dark-surface"
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
            className="font-bold leading-tight text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
          >
            Built with <span className="mk-gradient-text">modern tools.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[560px] leading-relaxed text-base text-slate-600 dark:text-slate-400"
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
                  className="mk-eyebrow mb-3 text-cyan-600 dark:text-cyan-400"
                >
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span
                      key={item.name}
                      className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-200 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-surface-elevated"
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
