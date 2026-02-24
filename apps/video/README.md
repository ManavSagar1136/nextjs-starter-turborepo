# @buildbase/video — Remotion Video App

Remotion video compositions living inside the CMS monorepo. Part of the `nextjs-starter-turborepo` Turborepo.

---

## Quick Start

```bash
# From the monorepo root — install all dependencies
yarn install

# Preview in Remotion Studio (hot-reload)
yarn workspace @buildbase/video dev
# → opens http://localhost:3000 in your browser

# Render the default composition (out/demo.mp4)
yarn workspace @buildbase/video render

# Or from within apps/video/
cd apps/video
npm run dev
npm run render
```

---

## Commands

| Command               | Description                                         |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Opens Remotion Studio (browser preview, hot-reload) |
| `npm run render`      | Renders `Demo` composition → `out/demo.mp4`         |
| `npm run render:all`  | Renders landscape + square + story formats          |
| `npm run check-types` | TypeScript check                                    |
| `npm run lint`        | ESLint                                              |

---

## Adding a Composition

1. **Create your composition** in `src/compositions/MyVideo.tsx`

```tsx
// src/compositions/MyVideo.tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1 style={{ fontSize: 80 }}>Frame {frame}</h1>
    </AbsoluteFill>
  );
};
```

2. **Register it** in `src/Root.tsx`

```tsx
import { MyVideo } from "./compositions/MyVideo";

<Composition
  id="MyVideo"
  component={MyVideo}
  durationInFrames={300} // 10 seconds @ 30fps
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{}}
/>;
```

3. **Add a render script** in `package.json`

```json
"render:myvideo": "remotion render src/index.ts MyVideo out/my-video.mp4"
```

---

## Adding a Voiceover (ElevenLabs)

The `@buildbase/voice` package provides a `generateVoiceover()` utility that calls the ElevenLabs TTS API.

### 1. Set up your API key

Copy `.env.example` to `.env` and fill in your ElevenLabs credentials:

```bash
cp .env.example .env
```

```env
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel — or any voice from the library
```

### 2. Generate the audio

Run this script once to produce the MP3:

```ts
// scripts/generate-audio.ts (run with: npx tsx scripts/generate-audio.ts)
import "dotenv/config";
import { generateVoiceover } from "@buildbase/voice";

const result = await generateVoiceover({
  text: "Welcome to the CMS monorepo. Powered by Remotion and ElevenLabs.",
  filename: "intro",
  outputDir: "./public/audio",
});

console.log("Saved to:", result.relativePath);
// → public/audio/intro.mp3
```

### 3. Use it in your composition

```tsx
import { Audio, staticFile } from "remotion";

export const MyVideo: React.FC = () => (
  <AbsoluteFill>
    <Audio src={staticFile("audio/intro.mp3")} />
    {/* ...your scenes */}
  </AbsoluteFill>
);
```

> **Tip:** Run `generate-audio.ts` as a pre-render step in CI to keep audio files out of git while still automating the pipeline.

---

## Project Structure

```
apps/video/
├── src/
│   ├── index.ts               # Remotion CLI entry point
│   ├── Root.tsx               # Composition registry
│   ├── compositions/
│   │   └── Demo.tsx           # Demo composition (3 scenes, 15s)
│   ├── components/
│   │   └── TitleCard.tsx      # Reusable animated title card
│   └── utils/
│       └── theme.ts           # Colors, fonts, format presets
├── out/                       # Rendered MP4s (gitignored)
├── public/audio/              # Generated voiceover MP3s (gitignored)
├── .env.example               # Required env vars
├── remotion.config.ts         # Remotion codec/format config
├── tsconfig.json
└── package.json
```

---

## Output Formats

| Composition ID | Dimensions       | Platforms                        |
| -------------- | ---------------- | -------------------------------- |
| `Demo`         | 1920×1080 (16:9) | YouTube, LinkedIn, Twitter/X     |
| `DemoSquare`   | 1080×1080 (1:1)  | Instagram feed, Facebook         |
| `DemoStory`    | 1080×1920 (9:16) | Instagram Reels, TikTok, Stories |

---

## ElevenLabs Voice Reference

Popular voice IDs:

| Voice  | ID                     | Style                    |
| ------ | ---------------------- | ------------------------ |
| Rachel | `21m00Tcm4TlvDq8ikWAM` | US English, calm, clear  |
| Domi   | `AZnzlk1XvdvUeBnXmlld` | US English, strong       |
| Bella  | `EXAVITQu4vr4xnSDxMaL` | US English, soft         |
| Antoni | `ErXwobaYiN019PkySvjV` | US English, professional |
| Josh   | `TxGEqnHWrfWFTfGW9XjX` | US English, deep         |

Browse the full library: [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library)

---

## @buildbase/voice API

```ts
import { generateVoiceover } from "@buildbase/voice";

const result = await generateVoiceover({
  text: string;           // required — text to speak
  voiceId?: string;       // ElevenLabs voice ID (or ELEVENLABS_VOICE_ID env)
  apiKey?: string;        // API key (or ELEVENLABS_API_KEY env)
  outputDir?: string;     // where to save (or VOICEOVER_OUTPUT_DIR env)
  filename?: string;      // output filename without .mp3 (default: timestamp)
  modelId?: string;       // ElevenLabs model (default: eleven_multilingual_v2)
  stability?: number;     // 0–1 (default: 0.5)
  similarityBoost?: number; // 0–1 (default: 0.75)
  style?: number;         // 0–1 (default: 0, v2 models only)
  useSpeakerBoost?: boolean; // default: true
});

// Returns:
// {
//   filePath: string;     // absolute path
//   filename: string;     // e.g. "intro.mp3"
//   relativePath: string; // e.g. "public/audio/intro.mp3"
//   sizeBytes: number;
// }
```
