import React from "react";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import { Affiliates } from "@/components/marketing/Affiliates";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Affiliates",
    description: "Affiliates",
    url: `${SiteConfig.baseUrl}${Routes.affiliates}`,
  });
}

function AffiliatesPage() {
  return <Affiliates />;
}

export default AffiliatesPage;
