import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT } from "../utils/theme";

interface TitleCardProps {
  title: string;
  subtitle?: string;
  /** Frame at which the animation starts (default: 0) */
  startFrame?: number;
  /** Show background grid pattern */
  showGrid?: boolean;
}

/**
 * Reusable animated title card — use this as a scene opener.
 *
 * @example
 * <TitleCard title="Hello World" subtitle="A demo composition" />
 */
export const TitleCard: React.FC<TitleCardProps> = ({ title, subtitle, startFrame = 0, showGrid = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - startFrame;

  // Title entrance
  const titleScale = spring({
    frame: f - 5,
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.8 },
  });
  const titleOpacity = interpolate(f, [5, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle entrance
  const subY = interpolate(f, [18, 35], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(f, [18, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing glow
  const glowSize = interpolate(f % 60, [0, 30, 60], [220, 320, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bgDark,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Grid bg */}
      {showGrid && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      )}

      {/* Glow orb */}
      <div
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primaryGlow} 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Title */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: "-2px",
          lineHeight: 1.1,
          textAlign: "center",
          margin: 0,
          padding: "0 80px",
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          zIndex: 1,
          background: COLORS.gradientPrimary,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: COLORS.textSecondary,
            margin: "20px 0 0",
            textAlign: "center",
            padding: "0 120px",
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            zIndex: 1,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
