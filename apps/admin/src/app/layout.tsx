import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "@buildbase/sdk/css";
import "./globals.css";

import { AppProviders } from "@/components/providers/AppProviders";
import { GoogleAnalytics } from "@buildbase/components";
import { SiteConfig } from "@buildbase/utils/config";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: `${SiteConfig.name} — Admin`,
  description: SiteConfig.meta.description,
  openGraph: {
    title: `${SiteConfig.name} — Admin`,
    description: SiteConfig.meta.description,
    siteName: SiteConfig.name,
    images: [{ url: SiteConfig.ogImageUrl, width: 1200, height: 630, alt: SiteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SiteConfig.name} — Admin`,
    description: SiteConfig.meta.description,
    images: [{ url: SiteConfig.ogImageUrl, alt: SiteConfig.name }],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};
async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleAnalytics />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

export default RootLayout;
