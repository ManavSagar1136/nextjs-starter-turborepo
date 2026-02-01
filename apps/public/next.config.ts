import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  // TypeScript errors should be fixed, not ignored
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // Externalize packages that don't work well with bundlers
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "newrelic",
    "@newrelic/security-agent",
    "thread-stream",
  ],
  transpilePackages: [
    "@buildbase/ui",
    "@buildbase/magicui",
    "@buildbase/components",
    "@buildbase/api-helpers",
    "@buildbase/utils",
    "@buildbase/helpers",
    "@buildbase/hooks-manager",
    "@buildbase/tanstack-query",
    "@buildbase/env",
    "@buildbase/database",
  ],
  // Required for Prisma in monorepo - tells Next.js where to find files in packages/
  outputFileTracingRoot: resolve(__dirname, "../.."),
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
