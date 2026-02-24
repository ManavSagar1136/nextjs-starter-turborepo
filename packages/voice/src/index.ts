/**
 * @buildbase/voice — ElevenLabs TTS voiceover utility
 *
 * Generates MP3 voiceovers from text using the ElevenLabs API.
 * Output files are designed to be used with Remotion's <Audio> component.
 *
 * Quick start:
 *   1. Add ELEVENLABS_API_KEY to your .env (copy apps/video/.env.example)
 *   2. Call generateVoiceover({ text, outputDir: "./public/audio" })
 *   3. Use <Audio src={staticFile("audio/voiceover.mp3")} /> in a composition
 *
 * @example
 * ```ts
 * import { generateVoiceover } from "@buildbase/voice";
 *
 * const result = await generateVoiceover({
 *   text: "Hello from the CMS monorepo.",
 *   filename: "intro",
 * });
 * // → result.relativePath = "public/audio/intro.mp3"
 * ```
 */
export { generateVoiceover } from "./generateVoiceover";
export type { GenerateVoiceoverOptions, VoiceoverResult } from "./generateVoiceover";
