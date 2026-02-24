import fs from "node:fs";
import path from "node:path";

/** Options for generateVoiceover */
export interface GenerateVoiceoverOptions {
  /** The text to convert to speech */
  text: string;

  /**
   * ElevenLabs voice ID.
   * Falls back to ELEVENLABS_VOICE_ID env var, then to Rachel (21m00Tcm4TlvDq8ikWAM).
   * Browse voices: https://elevenlabs.io/voice-library
   */
  voiceId?: string;

  /**
   * ElevenLabs API key.
   * Falls back to ELEVENLABS_API_KEY env var.
   */
  apiKey?: string;

  /**
   * Directory where the output MP3 will be saved.
   * Falls back to VOICEOVER_OUTPUT_DIR env var, then to ./public/audio/.
   */
  outputDir?: string;

  /**
   * Output filename (without extension).
   * Defaults to a timestamp-based name.
   */
  filename?: string;

  /**
   * ElevenLabs model ID.
   * See: https://elevenlabs.io/docs/speech-synthesis/models
   * Default: "eleven_multilingual_v2"
   */
  modelId?: string;

  /** Stability (0–1). Default: 0.5 */
  stability?: number;

  /** Similarity boost (0–1). Default: 0.75 */
  similarityBoost?: number;

  /** Style (0–1, only for v2 models). Default: 0 */
  style?: number;

  /** Use speaker boost. Default: true */
  useSpeakerBoost?: boolean;
}

/** Result returned by generateVoiceover */
export interface VoiceoverResult {
  /** Absolute path to the saved .mp3 file */
  filePath: string;
  /** Filename only (e.g. "voiceover-1700000000.mp3") */
  filename: string;
  /** Relative path from the project root (for staticFile() in Remotion) */
  relativePath: string;
  /** File size in bytes */
  sizeBytes: number;
}

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const DEFAULT_MODEL = "eleven_multilingual_v2";
const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

/**
 * Generate a voiceover MP3 using ElevenLabs TTS and save it to disk.
 *
 * Designed for use with Remotion `<Audio src={staticFile("audio/...")} />`.
 *
 * @example
 * ```ts
 * import { generateVoiceover } from "@buildbase/voice";
 *
 * const result = await generateVoiceover({
 *   text: "Welcome to AgentCenter — Mission Control for your AI team.",
 *   voiceId: "21m00Tcm4TlvDq8ikWAM",
 *   outputDir: "./public/audio",
 *   filename: "intro",
 * });
 *
 * // In your Remotion composition:
 * // <Audio src={staticFile("audio/intro.mp3")} />
 * console.log(result.relativePath); // → "public/audio/intro.mp3"
 * ```
 */
export async function generateVoiceover(options: GenerateVoiceoverOptions): Promise<VoiceoverResult> {
  const {
    text,
    voiceId = process.env["ELEVENLABS_VOICE_ID"] ?? DEFAULT_VOICE_ID,
    apiKey = process.env["ELEVENLABS_API_KEY"],
    outputDir = process.env["VOICEOVER_OUTPUT_DIR"] ?? "./public/audio",
    filename = `voiceover-${Date.now()}`,
    modelId = DEFAULT_MODEL,
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0,
    useSpeakerBoost = true,
  } = options;

  if (!apiKey) {
    throw new Error(
      "[generateVoiceover] Missing ElevenLabs API key.\n" +
        "Set ELEVENLABS_API_KEY in your .env file or pass apiKey option.\n" +
        "Get your key at: https://elevenlabs.io/app/settings/api-keys"
    );
  }

  if (!text || text.trim().length === 0) {
    throw new Error("[generateVoiceover] text cannot be empty.");
  }

  // Build request
  const url = `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`;
  const body = {
    text: text.trim(),
    model_id: modelId,
    voice_settings: {
      stability,
      similarity_boost: similarityBoost,
      style,
      use_speaker_boost: useSpeakerBoost,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "(no body)");
    throw new Error(`[generateVoiceover] ElevenLabs API error ${response.status}: ${errorText}`);
  }

  // Save to disk
  const absOutputDir = path.resolve(outputDir);
  fs.mkdirSync(absOutputDir, { recursive: true });

  const outputFilename = filename.endsWith(".mp3") ? filename : `${filename}.mp3`;
  const absFilePath = path.join(absOutputDir, outputFilename);

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(absFilePath, buffer);

  const relativePath = path.relative(process.cwd(), absFilePath).replace(/\\/g, "/"); // normalise for Windows

  return {
    filePath: absFilePath,
    filename: outputFilename,
    relativePath,
    sizeBytes: buffer.length,
  };
}
