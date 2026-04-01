import { Config } from "@remotion/cli/config";

/**
 * Remotion configuration for @buildbase/video
 * See: https://www.remotion.dev/docs/config
 */
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Use H.264 codec for broad compatibility
Config.setCodec("h264");

// Concurrency — adjust based on your machine
// Config.setConcurrency(4);
