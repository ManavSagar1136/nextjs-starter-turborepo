import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  // TypeScript errors should be fixed, not ignored
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  transpilePackages: [
    "@buildbase/ui",
    "@buildbase/magicui",
    "@buildbase/components",
    "@buildbase/api-helpers",
    "@buildbase/utils",
    "@buildbase/helpers",
    "@buildbase/hooks-manager",
    "@buildbase/tanstack-query",
    "@buildbase/saas-sdk",
    "@buildbase/env",
  ],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;
