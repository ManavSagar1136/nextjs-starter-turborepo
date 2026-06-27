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
    "@buildbase/storage",
    "@google-cloud/storage",
    "google-auth-library",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "@prisma/client",
    ".prisma/client",
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
    "@buildbase/dialog-manager",
    "@buildbase/email",
    "@buildbase/logger",
    "@buildbase/database",
    "@mdxeditor/editor",
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
              "style-src 'self' 'unsafe-inline' https://editor.unlayer.com https://unlayer.com https://cdn.unlayer.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://editor.unlayer.com https://unlayer.com https://cdn.unlayer.com https://fonts.gstatic.com",
              "connect-src 'self' https://editor.unlayer.com https://unlayer.com https://cdn.unlayer.com https://storage.googleapis.com https://api.console.buildbase.app wss://editor.unlayer.com",
              "frame-src 'self' https://editor.unlayer.com https://unlayer.com",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
