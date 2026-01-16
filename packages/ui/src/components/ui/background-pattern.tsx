import React from "react";
import { cn } from "../../lib/utils";

/**
 * Enum for available background pattern styles.
 */
export const BACKGROUND_PATTERN_STYLES = {
  RADIAL: "radial",
  GRID: "grid",
  DIAGONAL: "diagonal",
} as const;

/**
 * Maps background style variants to their Tailwind and gradient class strings.
 */
const PATTERN_STYLES = {
  [BACKGROUND_PATTERN_STYLES.RADIAL]:
    "bg-[radial-gradient(circle,_rgba(0,0,0,0.05)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:20px_20px]",
  [BACKGROUND_PATTERN_STYLES.GRID]:
    "bg-[linear-gradient(rgba(0,0,0,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(0,0,0,0.05)_1px,_transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:20px_20px]",
  [BACKGROUND_PATTERN_STYLES.DIAGONAL]:
    "bg-[repeating-linear-gradient(45deg,_transparent,_transparent_10px,_rgba(0,0,0,0.03)_10px,_rgba(0,0,0,0.03)_20px)] dark:bg-[repeating-linear-gradient(45deg,_transparent,_transparent_10px,_rgba(255,255,255,0.03)_10px,_rgba(255,255,255,0.03)_20px)]",
};

/**
 * Props for the {@link BackgroundPattern} component.
 *
 * @property children - Content to render above the background pattern.
 * @property className - Additional CSS classes to apply to the root div.
 * @property variant - Pattern type; one of "radial", "grid", or "diagonal". Defaults to "radial".
 * @property opacity - Opacity of the background pattern, as a number between 0 and 1. Defaults to 1.
 */
interface BackgroundPatternProps {
  children: React.ReactNode;
  className?: string;
  variant?: (typeof BACKGROUND_PATTERN_STYLES)[keyof typeof BACKGROUND_PATTERN_STYLES];
  opacity?: number;
}

/**
 * Renders a customizable background pattern layered behind its children.
 *
 * The pattern can be set to radial dots, grid, or diagonal stripes, and supports
 * dark mode via Tailwind classes. The overlay's opacity can be adjusted, and
 * content is rendered above the pattern.
 *
 * @example
 * ```tsx
 * <BackgroundPattern variant="grid" opacity={0.5}>
 *   <YourContent />
 * </BackgroundPattern>
 * ```
 */
export const BackgroundPattern: React.FC<BackgroundPatternProps> = ({
  children,
  className,
  variant = BACKGROUND_PATTERN_STYLES.RADIAL,
  opacity = 1,
}) => {
  return (
    <div className={cn("relative w-full", className)}>
      {/* Pattern Background */}
      <div
        className={cn("absolute inset-0 h-full w-full", PATTERN_STYLES[variant])}
        style={{ opacity }}
        aria-hidden="true"
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
