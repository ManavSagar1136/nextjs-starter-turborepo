import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import { GoogleAnalytics } from "@buildbase/components";

export const metadata = {
  title: "CMS Documentation",
  description: "Comprehensive documentation for CMS API, tutorials, guides, and examples",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const navbar = <Navbar logo={<b>CMS Documentation</b>} />;
  const pageMap = await getPageMap();
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head faviconGlyph="✦" />
      <body>
        <GoogleAnalytics />
        <Layout
          navbar={navbar}
          footer={<Footer>© {new Date().getFullYear()} CMS Documentation. All rights reserved.</Footer>}
          docsRepositoryBase="https://github.com"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          pageMap={pageMap}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
