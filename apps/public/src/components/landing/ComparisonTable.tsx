"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";

import { COMPARISON_FEATURES, COMPARISON_HEADERS, type ComparisonFeature } from "@/data/landing";
import { getMotionVariant, fadeUp } from "@/lib/animation-variants";

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
        style={{ background: "rgba(16, 185, 129, 0.15)" }}
      >
        <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
        style={{ background: "rgba(239, 68, 68, 0.1)" }}
      >
        <X size={14} style={{ color: "#EF4444" }} />
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
      {value}
    </span>
  );
}

export function ComparisonTable() {
  const shouldReduce = useReducedMotion();
  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);
  const tableVariant = getMotionVariant(shouldReduce, fadeUp);

  return (
    <section
      id="comparison"
      className="w-full py-20 md:py-32 px-5 md:px-20 bg-slate-50 dark:bg-dark-surface-secondary"
      aria-labelledby="compare-heading"
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
          <span className="mk-eyebrow mb-3 block">Comparison</span>
          <h2
            id="compare-heading"
            className="font-bold leading-tight text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
          >
            How we <span className="mk-gradient-text">stack up.</span>
          </h2>
          <p
            className="mx-auto mt-4 max-w-[560px] leading-relaxed text-base text-slate-600 dark:text-slate-400"
          >
            See how BuildBase NextJS Starter compares to popular CMS platforms.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          variants={tableVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative mx-auto max-w-[900px]"
        >
          {/* Scroll hint gradient for mobile */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-slate-50 dark:from-dark-surface-secondary to-transparent md:hidden" aria-hidden="true" />
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse" role="table">
            <thead>
              <tr>
                <th
                  className="pb-4 pr-4 text-left text-sm font-semibold text-slate-400 dark:text-slate-600"
                >
                  Feature
                </th>
                {COMPARISON_HEADERS.map((h) => (
                  <th
                    key={h.key}
                    className={`pb-4 text-center text-sm font-semibold ${
                      h.highlight ? "text-indigo-500" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((row: ComparisonFeature, i) => (
                <tr
                  key={row.feature}
                  className="border-t border-slate-200 dark:border-slate-800"
                >
                  <td
                    className="py-3 pr-4 text-sm font-medium text-slate-600 dark:text-slate-400"
                  >
                    {row.feature}
                  </td>
                  {COMPARISON_HEADERS.map((h) => (
                    <td
                      key={h.key}
                      className="py-3 text-center"
                      style={{
                        background: h.highlight && i % 2 === 0 ? "rgba(99, 102, 241, 0.04)" : undefined,
                      }}
                    >
                      <CellValue value={row[h.key as keyof ComparisonFeature] as boolean | string} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
