"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";

import { SiteConfig } from "@/config";
import { useGetStarted } from "@/hooks/use-get-started";
import { isProductLaunched } from "@/lib/utils/launch-status";
import { getMotionVariant, ctaContent } from "@/lib/animation-variants";

export function CTASection() {
  const shouldReduce = useReducedMotion();
  const { isLoadingCta, isLoginLoading, onGetStartedClick, isLogged } = useGetStarted();
  const isProductLive = isProductLaunched();

  const variant = getMotionVariant(shouldReduce, ctaContent);

  return (
    <section
      className="relative w-full overflow-hidden py-20 md:py-32 px-5 md:px-20 bg-white dark:bg-dark-surface"
      aria-label="Call to action"
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        variants={variant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center gap-6 text-center"
      >
        <h2
          className="font-extrabold leading-tight text-3xl md:text-4xl text-slate-900 dark:text-slate-50"
        >
          Start building your CMS{" "}
          <span className="mk-gradient-text">today.</span>
        </h2>
        <p
          className="max-w-[480px] leading-relaxed text-lg text-slate-600 dark:text-slate-400"
        >
          Clone the template, define your content models, and deploy — all in under 10 minutes.
          No vendor lock-in. No monthly fees. Just code.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {isProductLive && (
            <button
              onClick={onGetStartedClick}
              disabled={isLoadingCta || isLoginLoading}
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 bg-indigo-500 shadow-[0_0_32px_rgba(99,102,241,0.15)] dark:shadow-[0_0_32px_rgba(99,102,241,0.25)]"
              aria-label={isLogged ? "Go to the app" : "Get started for free"}
            >
              {isLogged ? "Go to app" : "Get Started Free"}
            </button>
          )}

          <button
            onClick={() =>
              window.open(SiteConfig.calendlyLink, "_blank", "noopener,noreferrer")
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-200 hover:border-indigo-500 hover:text-slate-900 dark:hover:text-slate-50"
            aria-label="Book a demo"
          >
            <Play size={14} strokeWidth={2} />
            Book a Demo
          </button>
        </div>
      </motion.div>
    </section>
  );
}
