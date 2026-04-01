import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import { AppProviders } from "@/components/providers/AppProviders";
import { InitializeDialogs } from "@/dialogs/initialize";
import { GoogleAnalytics } from "@buildbase/components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = generateSEOMetadata({
  title: SiteConfig.meta.title,
  description: SiteConfig.meta.description,
  url: SiteConfig.baseUrl,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <AppProviders>
          <InitializeDialogs />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
