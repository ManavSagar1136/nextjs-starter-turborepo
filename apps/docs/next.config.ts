import type { NextConfig } from "next";
import { resolve } from "path";
import nextra from "nextra";

const withNextra = nextra({
  // Nextra 4.0 configuration
  // Content directory is at src/content
  // contentDirBasePath: "/content",
  latex: true, // Enable LaTeX support
  search: {
    codeblocks: false,
  },
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["nextra", "nextra-theme-docs"],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
  // Performance optimizations
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withNextra(nextConfig);
