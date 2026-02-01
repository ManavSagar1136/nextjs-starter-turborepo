import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  // TypeScript errors should be fixed, not ignored
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // Externalize packages that don't work well with bundlers
  // These have native modules or test files that break Turbopack
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "newrelic",
    "@newrelic/security-agent",
    "thread-stream",
    "@buildbase/storage",
    "@google-cloud/storage",
    "google-auth-library",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
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
    "@buildbase/http-client",
    "@buildbase/database",
    "@buildbase/env",
    "@buildbase/saas-sdk",
    "@buildbase/redux",
    "@buildbase/dialog-manager",
    "@buildbase/logger",
    "@buildbase/database",
  ],
  // Required for Prisma in monorepo - tells Next.js where to find files in packages/
  outputFileTracingRoot: resolve(__dirname, "../.."),
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;
