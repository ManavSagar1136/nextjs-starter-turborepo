import sharedConfig from "@buildbase/tailwind-config/tailwind.config.ts";
import type { Config } from "tailwindcss";

/**
 * Public app Tailwind configuration
 * Extends shared config with app-specific content paths and brand colors
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/magicui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/components/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [sharedConfig as unknown as Config],
  theme: {
    extend: {
      colors: {
        // Non-standard dark mode backgrounds (slight blue tint for brand feel)
        "dark-surface": "#0A0A0F",
        "dark-surface-secondary": "#111118",
        "dark-surface-elevated": "#1A1A24",
      },
    },
  },
};

export default config;
