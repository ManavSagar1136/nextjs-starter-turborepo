import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@buildbase/sdk/dist/saas-os.css";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "User App",
  description: "User-facing application",
};

async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleAnalytics />
        <AppProviders>
          <InitializeDialogs />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

export default RootLayout;
