/**
 * Framer Motion Animation Variants
 *
 * Usage:
 *   import { fadeUp, staggerContainer } from "@/lib/animation-variants";
 *   <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
 *
 * All animations must be used inside a `useReducedMotion()` guard:
 *   const shouldReduce = useReducedMotion();
 *   const variant = getMotionVariant(shouldReduce, fadeUp);
 */

import type { Variants } from "framer-motion";

/** Global easing */
const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const;

export const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;
export const VIEWPORT = { once: true, margin: "-100px" } as const;

// ─── Core Variants ──────────────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const fadeOpacity: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export const slideRight: Variants = {
  hidden:  { scaleX: 0, originX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.6, ease: "easeInOut" } },
};

// ─── Component-Specific Variants ────────────────────────────────────────────

export const navEntrance: Variants = {
  hidden:  { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.1 } },
};

export const heroHeadline: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay: 0.35 } },
};

export const heroEyebrow: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT, delay: 0.2 } },
};

export const heroCta: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT, delay: 0.5 } },
};

export const heroSocialProof: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, delay: 0.65 } },
};

export const heroVisual: Variants = {
  hidden:  { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE_OUT, delay: 0.4 } },
};

export const bentoCard: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

export const stepContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export const stepItem: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const ctaContent: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

export const pulseGlow = {
  boxShadow: [
    "0 0 16px rgba(99, 102, 241, 0.3)",
    "0 0 32px rgba(99, 102, 241, 0.6)",
    "0 0 16px rgba(99, 102, 241, 0.3)",
  ],
  transition: { duration: 2, ease: "easeInOut", repeat: Infinity },
};

// ─── Helper ─────────────────────────────────────────────────────────────────

export function getMotionVariant(
  shouldReduce: boolean | null,
  fullVariant: Variants,
): Variants {
  return shouldReduce ? fadeOpacity : fullVariant;
}
