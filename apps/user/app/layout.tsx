import "@buildbase/ui/styles.css";
import "@buildbase/sdk/dist/saas-os.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import SaaSProvider from "@/components/providers/SaaSProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "User App",
  description: "User-facing application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <SaaSProvider>{children}</SaaSProvider>
      </body>
    </html>
  );
}
