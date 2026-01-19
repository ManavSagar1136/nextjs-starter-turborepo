import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import DocsListing from "@/components/doc/DocsListing";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Documentation",
    description: "Complete guides and reference documentation for our platform",
    url: `${SiteConfig.baseUrl}${Routes.docs}`,
  });
}

const DocsPage = () => {
  return (
    <DocsListing
      title="Documentation"
      description="Complete guides and reference documentation for our platform"
    />
  );
};

export default DocsPage;
