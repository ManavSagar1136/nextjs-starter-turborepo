import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TitleCard } from "../components/TitleCard";
import { COLORS, FONT, FPS } from "../utils/theme";

// ------------------------------------------------------------------
// Optional: ElevenLabs voiceover
//
// To add a voiceover:
// 1. Run `generateVoiceover()` from @buildbase/voice to produce an MP3
// 2. Place it in apps/video/public/audio/voiceover.mp3
// 3. Uncomment the <Audio> tag below
//
// import { staticFile } from "remotion";
// <Audio src={staticFile("audio/voiceover.mp3")} />
// ------------------------------------------------------------------

/** A single animated feature bullet */
const FeatureBullet: React.FC<{
  icon: string;
  text: string;
  delay: number;
}> = ({ icon, text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sc = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.7 },
  });
  const op = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "16px 24px",
        background: COLORS.bgCard,
        border: `1px solid rgba(99,102,241,0.18)`,
        borderRadius: 16,
        transform: `scale(${sc})`,
        opacity: op,
      }}
    >
      <span style={{ fontSize: 32 }}>{icon}</span>
      <span
        style={{
          fontSize: 22,
          color: COLORS.textPrimary,
          fontWeight: 500,
          fontFamily: FONT.family,
        }}
      >
        {text}
      </span>
    </div>
  );
};

/** Features scene — animated bullet list */
const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const headingOp = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headingY = interpolate(frame, [0, 18], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const features = [
    { icon: "⚡", text: "Turbo-powered monorepo build pipeline" },
    { icon: "🎥", text: "Remotion compositions with spring animations" },
    { icon: "🎙️", text: "ElevenLabs TTS voiceover integration" },
    { icon: "🔧", text: "TypeScript · React 19 · Node 20" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bgDark,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 120px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <div
        style={{
          opacity: headingOp,
          transform: `translateY(${headingY}px)`,
          textAlign: "center",
          marginBottom: 40,
          zIndex: 1,
        }}
      >
        <p
          style={{
            color: COLORS.primaryLight,
            fontSize: 16,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 3,
            margin: "0 0 10px",
          }}
        >
          What's included
        </p>
        <h2
          style={{
            fontSize: 54,
            fontWeight: 900,
            letterSpacing: "-1.5px",
            color: COLORS.textPrimary,
            margin: 0,
          }}
        >
          @buildbase/video + @buildbase/voice
        </h2>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          maxWidth: 840,
          zIndex: 1,
        }}
      >
        {features.map((f, i) => (
          <FeatureBullet key={i} {...f} delay={14 + i * 10} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** CTA / outro scene */
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sc = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 110 },
  });
  const op = interpolate(frame, [5, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowR = interpolate(frame % 50, [0, 25, 50], [240, 340, 240], {
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
      <div
        style={{
          position: "absolute",
          width: glowR,
          height: glowR,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primaryGlow} 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div
        style={{
          transform: `scale(${sc})`,
          opacity: op,
          textAlign: "center",
          zIndex: 1,
          padding: "0 80px",
        }}
      >
        <h2
          style={{
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: "-2px",
            margin: "0 0 20px",
            background: COLORS.gradientPrimary,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Ready to build?
        </h2>
        <p
          style={{
            fontSize: 26,
            color: COLORS.textSecondary,
            margin: "0 0 36px",
          }}
        >
          Edit{" "}
          <code
            style={{
              background: COLORS.bgCard,
              padding: "4px 12px",
              borderRadius: 8,
              fontSize: 22,
              color: COLORS.primaryLight,
              fontFamily: "monospace",
            }}
          >
            apps/video/src/compositions/Demo.tsx
          </code>{" "}
          to add your own scenes.
        </p>
        <div
          style={{
            background: COLORS.gradientPrimary,
            borderRadius: 16,
            padding: "18px 48px",
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            display: "inline-block",
          }}
        >
          nextjs-starter-turborepo
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------
// Main Demo composition — 15 seconds / 450 frames @ 30fps
// Scene layout:
//   0–120    Intro title card  (4s)
//   110–300  Features scene    (6.3s, overlaps for smooth transition)
//   290–450  Outro / CTA       (5.3s, overlaps)
// ------------------------------------------------------------------
export const Demo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bgDark }}>
      {/* Uncomment to add ElevenLabs voiceover:
      <Audio src={staticFile("audio/voiceover.mp3")} /> */}

      <Sequence from={0} durationInFrames={130}>
        <TitleCard
          title="BuildBase NextJS Starter Turborepo"
          subtitle="Remotion + ElevenLabs · Video generation scaffolded"
        />
      </Sequence>

      <Sequence from={115} durationInFrames={195}>
        <FeaturesScene />
      </Sequence>

      <Sequence from={295} durationInFrames={155}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
