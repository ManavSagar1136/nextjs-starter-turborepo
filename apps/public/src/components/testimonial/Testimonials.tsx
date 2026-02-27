"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TbStarFilled, TbQuote } from "react-icons/tb";

import { CMS_TESTIMONIALS } from "@/data/landing";
import { getMotionVariant, fadeUp, staggerContainer } from "@/lib/animation-variants";

function TestimonialCard({
  text,
  name,
  job,
  company,
  highlightSentences,
}: {
  text: string;
  name: string;
  job: string;
  company: string;
  highlightSentences: string[];
}) {
  // Simple highlight: bold the matching sentence
  const highlighted = highlightSentences.reduce((acc, sentence) => {
    return acc.replace(sentence, `**${sentence}**`);
  }, text);

  // Parse ** markers into bold spans
  const parts = highlighted.split(/(\*\*.*?\*\*)/g);

  // Get initials for avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <article
      className="mk-card flex flex-col gap-5 p-6 bg-slate-100 dark:bg-dark-surface-elevated"
    >
      {/* Quote icon */}
      <TbQuote
        className="h-8 w-8 opacity-20 text-indigo-500"
        aria-hidden="true"
      />

      {/* Quote text */}
      <p
        className="flex-1 leading-relaxed text-sm text-slate-600 dark:text-slate-400"
      >
        {parts.map((part, i) =>
          part.startsWith("**") ? (
            <span key={i} className="font-semibold text-slate-900 dark:text-slate-50">
              {part.replace(/\*\*/g, "")}
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </p>

      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <TbStarFilled key={i} className="h-4 w-4" style={{ color: "#F59E0B" }} aria-hidden="true" />
        ))}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 border-t pt-4 border-slate-200 dark:border-slate-800">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white bg-indigo-500"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div>
          <p
            className="text-sm font-semibold text-slate-900 dark:text-slate-50"
          >
            {name}
          </p>
          <p
            className="text-xs text-slate-400 dark:text-slate-600"
          >
            {job}
          </p>
        </div>
      </div>
    </article>
  );
}

const Testimonials = () => {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);
  const containerVariant = getMotionVariant(shouldReduce, staggerContainer);
  const itemVariant = getMotionVariant(shouldReduce, fadeUp);

  return (
    <section
      id="testimonials"
      className="w-full py-20 md:py-32 px-5 md:px-20 bg-white dark:bg-dark-surface"
      aria-labelledby="testimonials-heading"
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
          <span className="mk-eyebrow mb-3 block">Testimonials</span>
          <h2
            id="testimonials-heading"
            className="font-bold leading-tight text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
          >
            Loved by <span className="mk-gradient-text">developers.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[480px] leading-relaxed text-base text-slate-600 dark:text-slate-400"
          >
            See what engineering leaders say about building with our CMS template.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto grid max-w-[1000px] gap-6 sm:grid-cols-2"
        >
          {CMS_TESTIMONIALS.map((t, i) => (
            <motion.div key={i} variants={itemVariant}>
              <TestimonialCard
                text={t.text}
                name={t.name}
                job={t.job}
                company={t.company}
                highlightSentences={t.highlightSentences}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
