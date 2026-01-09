import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    "@repo/ui",
    "@repo/magicui",
    "@repo/components",
    "@repo/api-helpers",
    "@repo/utils",
    "@repo/helpers",
    "@repo/hooks-manager",
    "@repo/tanstack-query",
  ],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;
