import "@buildbase/ui/styles.css";
import "@buildbase/sdk/dist/saas-os.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@buildbase/ui/components/providers/ThemeProvider";
import SaaSProvider from "@/components/providers/SaaSProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin panel for data management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SaaSProvider>{children}</SaaSProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
