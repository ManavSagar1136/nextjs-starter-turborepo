"use client";

import Script from "next/script";

export const GoogleAnalytics = () => {
  const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  if (!GA_ID) {
    return null;
  }

  return (
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
  );
};
