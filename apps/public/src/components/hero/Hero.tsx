"use client";

import { useReducedMotion, motion } from "framer-motion";
import { Play } from "lucide-react";
import { TbStarFilled } from "react-icons/tb";

import { AvatarCircles } from "@buildbase/magicui/components/avatar-circles";

import { SiteConfig } from "@/config";
import { isProductLaunched } from "@/lib/utils/launch-status";
import { useGetStarted } from "@/hooks/use-get-started";
import {
  getMotionVariant,
  heroEyebrow,
  heroHeadline,
  heroCta,
  heroSocialProof,
  heroVisual,
  fadeOpacity,
} from "@/lib/animation-variants";

// ─── Types ────────────────────────────────────────────────────────────────────

type HeroProps = {
  showBookDemo?: boolean;
  showCta?: boolean;
  showUsers?: boolean;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const AVATAR_URLS = [
  {
    name: "Dharmendra Jagodana",
    imageUrl: "/users/dharmendra-jagodana.jpeg",
    profileUrl: "https://www.linkedin.com/in/dharmendra-jagodana-156246124/",
  },
  {
    name: "Dharmik Jagodana",
    imageUrl: "/users/dharmik-jagodana.jpeg",
    profileUrl: "https://www.linkedin.com/in/dharmikjagodana/",
  },
  {
    name: "Karupali Patel",
    imageUrl: "/users/krupali-patel.jpeg",
    profileUrl: "https://www.linkedin.com/in/krupali-patel-920961218/",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated background — radial mesh gradient with slow drift */
function HeroBackground({ shouldReduce }: { shouldReduce: boolean | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base dark fill */}
      <div className="absolute inset-0 bg-white dark:bg-dark-surface" />

      {/* Radial mesh gradient */}
      <motion.div
        className="absolute inset-0 mk-gradient-hero"
        animate={
          shouldReduce
            ? {}
            : {
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
              }
        }
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      />

      {/* Secondary cyan glow — bottom right */}
      <div
        className="absolute bottom-0 right-0 h-[60%] w-[50%] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.4) 0%, transparent 60%)",
        }}
      />

      {/* Grain overlay for depth */}
      <div className="mk-grain absolute inset-0" />
    </div>
  );
}

/** Pulsing dot for the eyebrow label */
function PulsingDot({ shouldReduce }: { shouldReduce: boolean | null }) {
  return (
    <span className="relative mr-2 inline-flex h-2 w-2" aria-hidden="true">
      {!shouldReduce && (
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-indigo-500"
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"
      />
    </span>
  );
}

/** CMS Dashboard mockup card */
function HeroVisualMockup() {
  return (
    <div
      className="mk-card relative mx-auto w-full max-w-[520px] overflow-hidden p-5 bg-slate-50 dark:bg-dark-surface-secondary"
      aria-hidden="true"
    >
      {/* Card header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
            Content Dashboard
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            BuildBase NextJS Starter Admin
          </p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
          style={{
            background: "rgba(16,185,129,0.12)",
          }}
        >
          Live
        </span>
      </div>

      {/* Metric row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Posts", value: "248" },
          { label: "Pages", value: "32" },
          { label: "Users", value: "156" },
          { label: "API Calls", value: "12.4k" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg p-2.5 text-center bg-slate-100 dark:bg-dark-surface-elevated"
          >
            <p className="text-[10px] text-slate-400 dark:text-slate-600">
              {label}
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent content items */}
      <div className="space-y-2">
        {[
          { title: "Getting Started with Next.js 15", status: "Published", type: "Blog" },
          { title: "API Reference: Content Types", status: "Draft", type: "Docs" },
          { title: "Release Notes v2.0", status: "Review", type: "Page" },
        ].map(({ title, status, type }) => (
          <div
            key={title}
            className="flex items-center justify-between rounded-lg px-3 py-2 bg-slate-100 dark:bg-dark-surface-elevated"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-indigo-500/[0.08] dark:bg-indigo-500/12 text-indigo-500"
              >
                {type}
              </span>
              <span className="truncate text-xs text-slate-600 dark:text-slate-400">{title}</span>
            </div>
            <span
              className={`shrink-0 text-[10px] font-medium ${
                status === "Published"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : status === "Draft"
                    ? "text-slate-400 dark:text-slate-600"
                    : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {status}
            </span>
          </div>
        ))}
      </div>

      {/* Footer row */}
      <div
        className="mt-4 flex items-center justify-between border-t pt-3 text-[10px] border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600"
      >
        <span>5 apps connected</span>
        <span className="text-cyan-600 dark:text-cyan-400">View all content →</span>
      </div>
    </div>
  );
}

// ─── Main Hero component ──────────────────────────────────────────────────────

export const Hero = ({
  showUsers = true,
  showCta = true,
  showBookDemo = true,
}: HeroProps) => {
  const shouldReduce = useReducedMotion();
  const { isLoadingCta, isLoginLoading, onGetStartedClick, isLogged } = useGetStarted();
  const isProductLive = isProductLaunched();

  const shouldShowCta = showCta && isProductLive;

  const eyebrowVariant = getMotionVariant(shouldReduce, heroEyebrow);
  const headlineVariant = getMotionVariant(shouldReduce, heroHeadline);
  const ctaVariant = getMotionVariant(shouldReduce, heroCta);
  const socialVariant = getMotionVariant(shouldReduce, heroSocialProof);
  const visualVariant = getMotionVariant(shouldReduce, heroVisual);

  return (
    <section
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
      aria-label="Hero"
    >
      <HeroBackground shouldReduce={shouldReduce} />

      <div className="relative z-10 mx-auto flex w-full max-w-[800px] flex-col items-center gap-8">

        {/* Eyebrow label */}
        <motion.div
          variants={eyebrowVariant}
          initial="hidden"
          animate="visible"
          className="mk-eyebrow flex items-center"
        >
          <PulsingDot shouldReduce={shouldReduce} />
          Open-Source CMS Template
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={headlineVariant}
          initial="hidden"
          animate="visible"
          className="font-extrabold leading-[1.05] tracking-tight text-4xl md:text-6xl lg:text-7xl text-slate-900 dark:text-slate-50"
        >
          Headless CMS,{" "}
          <span className="mk-gradient-text">Your Way.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={headlineVariant}
          initial="hidden"
          animate="visible"
          className="max-w-[560px] leading-relaxed text-lg text-slate-600 dark:text-slate-400"
        >
          A production-ready monorepo with admin dashboard, public site, docs,
          and user portal — all type-safe, all connected, all yours.
        </motion.p>

        {/* CTA row */}
        <motion.div
          variants={ctaVariant}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-3 sm:flex-row"
        >
          {shouldShowCta && (
            <button
              onClick={onGetStartedClick}
              disabled={isLoadingCta || isLoginLoading}
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_32px_rgba(99,102,241,0.25)] disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-500"
              aria-label={isLogged ? "Go to the app" : "Start for free"}
            >
              {isLogged ? "Go to app" : "Start for Free"}
            </button>
          )}

          {showBookDemo && (
            <button
              onClick={() =>
                window.open(SiteConfig.calendlyLink, "_blank", "noopener,noreferrer")
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-200 hover:border-indigo-500 hover:text-slate-900 dark:hover:text-slate-50"
              aria-label="Watch a product demo"
            >
              <Play size={14} strokeWidth={2} />
              See Demo
            </button>
          )}
        </motion.div>

        {/* Social proof strip */}
        {showUsers && (
          <motion.div
            variants={socialVariant}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
            aria-label="Social proof"
          >
            <AvatarCircles numPeople={497} avatarUrls={AVATAR_URLS} />
            <div className="flex flex-col items-center sm:items-start">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Trusted by 500+ developers
              </p>
              <div className="mt-0.5 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <TbStarFilled
                    key={i}
                    className="h-3.5 w-3.5"
                    style={{ color: "#F59E0B" }}
                    aria-hidden="true"
                  />
                ))}
                <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-600">
                  5.0 · 120 reviews
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Hero visual — dashboard mockup card */}
      <motion.div
        variants={visualVariant}
        initial="hidden"
        animate="visible"
        className="relative z-10 mt-16 w-full max-w-[800px] px-4"
      >
        {/* Glow behind the card */}
        <div
          className="pointer-events-none absolute inset-x-1/4 top-4 h-32 blur-3xl"
          style={{ background: "rgba(99,102,241,0.2)" }}
          aria-hidden="true"
        />
        <HeroVisualMockup />
      </motion.div>
    </section>
  );
};
