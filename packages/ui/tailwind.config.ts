// tailwind config is required for editor support
import sharedConfig from "@buildbase/tailwind-config/tailwind.config.ts";
import type { Config } from "tailwindcss";

const config: Pick<Config, "presets"> = {
  presets: [
    {
      ...(sharedConfig as unknown as Record<string, unknown>),
    },
  ],
};

export default config;
