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
      <div className="absolute inset-0" style={{ background: "var(--mk-bg-primary)" }} />

      {/* Radial mesh gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "var(--mk-gradient-hero)",
        }}
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
          className="absolute inline-flex h-full w-full rounded-full"
          style={{ backgroundColor: "var(--mk-brand)" }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ backgroundColor: "var(--mk-brand)" }}
      />
    </span>
  );
}

/** Floating analytics card — hero visual mockup */
function HeroVisualMockup() {
  return (
    <div
      className="mk-card relative mx-auto w-full max-w-[420px] overflow-hidden p-5"
      style={{ background: "var(--mk-bg-secondary)" }}
      aria-hidden="true"
    >
      {/* Card header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--mk-brand)" }}>
            Link Analytics
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--mk-text-primary)" }}>
            maketiny.co/launch
          </p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: "rgba(16,185,129,0.12)",
            color: "var(--mk-success)",
          }}
        >
          ↑ 24%
        </span>
      </div>

      {/* Metric row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Clicks", value: "12,847" },
          { label: "Unique", value: "8,391" },
          { label: "Conv.", value: "4.2%" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[var(--mk-radius-sm)] p-2.5 text-center"
            style={{ background: "var(--mk-bg-elevated)" }}
          >
            <p className="text-[10px]" style={{ color: "var(--mk-text-muted)" }}>
              {label}
            </p>
            <p className="text-sm font-bold" style={{ color: "var(--mk-text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Sparkline bars (decorative) */}
      <div className="flex items-end gap-1 h-10">
        {[40, 65, 45, 80, 60, 90, 75, 100, 85, 70, 95, 88].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              background:
                i === 7
                  ? "var(--mk-brand)"
                  : `rgba(99,102,241,${0.25 + (i / 12) * 0.35})`,
            }}
          />
        ))}
      </div>

      {/* Footer row */}
      <div
        className="mt-4 flex items-center justify-between border-t pt-3 text-[10px]"
        style={{ borderColor: "var(--mk-border)", color: "var(--mk-text-muted)" }}
      >
        <span>Last 30 days</span>
        <span style={{ color: "var(--mk-accent)" }}>View full report →</span>
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
          URL Intelligence Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={headlineVariant}
          initial="hidden"
          animate="visible"
          className="font-extrabold leading-[1.05] tracking-tight"
          style={{ fontSize: "var(--mk-text-hero)", color: "var(--mk-text-primary)" }}
        >
          Powerful Links.{" "}
          <span className="mk-gradient-text">Smarter Destinations.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={headlineVariant}
          initial="hidden"
          animate="visible"
          className="max-w-[560px] leading-relaxed"
          style={{ fontSize: "var(--mk-text-lg)", color: "var(--mk-text-secondary)" }}
        >
          One short link. Infinite smart routes. Send visitors to the right page
          based on device, location, time, or A/B test — and track everything.
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
              className="inline-flex items-center justify-center rounded-[var(--mk-radius-sm)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-mk-brand disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--mk-brand)" }}
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
              className="inline-flex items-center justify-center gap-2 rounded-[var(--mk-radius-sm)] border px-6 py-3 text-sm font-medium transition-all duration-200"
              style={{
                borderColor: "var(--mk-border-bright)",
                color: "var(--mk-text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--mk-brand)";
                e.currentTarget.style.color = "var(--mk-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--mk-border-bright)";
                e.currentTarget.style.color = "var(--mk-text-secondary)";
              }}
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
              <p className="text-sm font-semibold" style={{ color: "var(--mk-text-primary)" }}>
                Trusted by 500+ marketers
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
                <span className="ml-1.5 text-xs" style={{ color: "var(--mk-text-muted)" }}>
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
