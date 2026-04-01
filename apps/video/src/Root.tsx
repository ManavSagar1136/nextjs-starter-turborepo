import React from "react";
import { Composition } from "remotion";
import { Demo } from "./compositions/Demo";
import { FPS, FORMATS } from "./utils/theme";

/**
 * RemotionRoot — register all compositions here.
 *
 * Each <Composition> maps to a renderable output.
 * Run `npm run dev` to preview in Remotion Studio.
 * Run `npm run render` to export an MP4.
 *
 * To add a new composition:
 *   1. Create src/compositions/MyVideo.tsx
 *   2. Add a <Composition> entry below
 *   3. Add a render script to package.json if needed
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ----------------------------------------------------------------
       * Demo — 15s landscape (default render target)
       * ---------------------------------------------------------------- */}
      <Composition
        id="Demo"
        component={Demo}
        durationInFrames={450}
        fps={FPS}
        width={FORMATS.landscape.width}
        height={FORMATS.landscape.height}
        defaultProps={{}}
      />

      {/* ----------------------------------------------------------------
       * Demo — Square (Instagram feed, Facebook)
       * ---------------------------------------------------------------- */}
      <Composition
        id="DemoSquare"
        component={Demo}
        durationInFrames={450}
        fps={FPS}
        width={FORMATS.square.width}
        height={FORMATS.square.height}
        defaultProps={{}}
      />

      {/* ----------------------------------------------------------------
       * Demo — Portrait (Reels, TikTok, Stories)
       * ---------------------------------------------------------------- */}
      <Composition
        id="DemoStory"
        component={Demo}
        durationInFrames={450}
        fps={FPS}
        width={FORMATS.portrait.width}
        height={FORMATS.portrait.height}
        defaultProps={{}}
      />
    </>
  );
};
