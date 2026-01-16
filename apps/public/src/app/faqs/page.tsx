import React from "react";
import DUMMY_FAQS from "@/data/faqs";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import { FAQ } from "@/components/marketing/FAQ";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "FAQs",
    description: "Frequently asked questions",
    url: `${SiteConfig.baseUrl}${Routes.faqs}`,
  });
}

function FAQsPage() {
  return (
    <PageWithHeaderFooter>
      <FAQ faqs={DUMMY_FAQS} />
    </PageWithHeaderFooter>
  );
}

export default FAQsPage;
