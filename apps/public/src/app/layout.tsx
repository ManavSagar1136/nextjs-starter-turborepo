import "@buildbase/ui/styles.css";
import "./globals.css";
import { Geist } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";

const geist = Geist({ subsets: ["latin"] });

import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

export const metadata = generateSEOMetadata({
  title: SiteConfig.meta.title,
  description: SiteConfig.meta.description,
  url: SiteConfig.baseUrl,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
