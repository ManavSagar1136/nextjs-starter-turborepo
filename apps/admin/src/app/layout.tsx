import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "@buildbase/sdk/css";
import "./globals.css";

import { AppProviders } from "@/components/providers/AppProviders";
import { GoogleAnalytics } from "@buildbase/components";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin panel for data management",
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
