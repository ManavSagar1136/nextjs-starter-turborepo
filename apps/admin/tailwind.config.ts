import sharedConfig from "@buildbase/tailwind-config/tailwind.config.ts";
import type { Config } from "tailwindcss";

/**
 * Admin app Tailwind configuration
 * Extends shared config with app-specific content paths
 */
const config: Pick<Config, "presets"> = {
  presets: [
    {
      ...(sharedConfig as unknown as Record<string, unknown>),
      content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
        "../../packages/magicui/src/**/*.{js,ts,jsx,tsx}",
        "../../packages/components/src/**/*.{js,ts,jsx,tsx}",
      ],
    },
  ],
};

export default config;
