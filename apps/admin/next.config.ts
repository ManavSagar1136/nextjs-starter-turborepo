import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  // TypeScript errors should be fixed, not ignored
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // Externalize packages that don't work well with bundlers
  serverExternalPackages: ["pino", "pino-pretty", "newrelic", "@newrelic/security-agent", "thread-stream"],
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
    "@buildbase/database",
  ],
  // Required for Prisma in monorepo - tells Next.js where to find files in packages/
  outputFileTracingRoot: resolve(__dirname, "../.."),
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
  // Allow Unlayer email editor domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "editor.unlayer.com",
      },
      {
        protocol: "https",
        hostname: "unlayer.com",
      },
      {
        protocol: "https",
        hostname: "cdn.unlayer.com",
      },
    ],
  },
  // Content Security Policy headers for Unlayer
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://editor.unlayer.com https://unlayer.com https://cdn.unlayer.com",
              "style-src 'self' 'unsafe-inline' https://editor.unlayer.com https://unlayer.com https://cdn.unlayer.com",
              "img-src 'self' data: blob: https://editor.unlayer.com https://unlayer.com https://cdn.unlayer.com https://cdn.jsdelivr.net https://s3.amazonaws.com",
              "font-src 'self' data: https://editor.unlayer.com https://unlayer.com https://cdn.unlayer.com",
              "connect-src 'self' https://editor.unlayer.com https://unlayer.com https://cdn.unlayer.com wss://editor.unlayer.com",
              "frame-src 'self' https://editor.unlayer.com https://unlayer.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
