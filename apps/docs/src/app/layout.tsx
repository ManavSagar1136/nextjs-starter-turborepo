import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import Script from "next/script";
import "nextra-theme-docs/style.css";

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

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
        {GA_ID && (
          <>
            <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
          </>
        )}
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
