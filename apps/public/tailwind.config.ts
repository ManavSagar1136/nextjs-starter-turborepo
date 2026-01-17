import sharedConfig from "@buildbase/tailwind-config/tailwind.config.ts";
import type { Config } from "tailwindcss";

/**
 * Public app Tailwind configuration
 * Extends shared config with app-specific content paths
 */
const config: Pick<Config, "presets"> = {
  presets: [
    {
      ...(sharedConfig as unknown as Record<string, unknown>),
      content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
        "../../packages/magicui/src/**/*.{js,ts,jsx,tsx}",
        "../../packages/components/src/**/*.{js,ts,jsx,tsx}",
      ],
    },
  ],
};

export default config;
