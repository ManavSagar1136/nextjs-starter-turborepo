/**
 * Shared design tokens for @buildbase/video compositions.
 * Extend this file when adding new compositions.
 */
export const COLORS = {
  // Backgrounds
  bgDark: "#0f172a",
  bgCard: "#1e293b",
  bgGlass: "rgba(255,255,255,0.04)",

  // Primary palette
  primary: "#6366f1",
  primaryLight: "#818cf8",
  primaryGlow: "rgba(99,102,241,0.3)",

  // Secondary
  teal: "#14b8a6",
  tealLight: "#5eead4",
  tealGlow: "rgba(20,184,166,0.2)",

  // Semantic
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",

  // Text
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#475569",

  // Gradients (as CSS strings for style props)
  gradientPrimary: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)",
  gradientSubtle: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
} as const;

export const FONT = {
  family: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
};

/** Video format presets */
export const FORMATS = {
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1920 },
} as const;

/** Timing constants */
export const FPS = 30;
