import type { Config } from "tailwindcss";
import { sharedTailwindConfig } from "@buildbase/tailwind-config/config";

/**
 * Public app Tailwind configuration
 * Extends shared config with app-specific content paths
 */
const config: Config = {
  ...sharedTailwindConfig,
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
