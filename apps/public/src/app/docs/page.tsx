import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Documentation",
    description: "Complete guides and reference documentation for our platform",
    url: `${SiteConfig.baseUrl}${Routes.docs}`,
  });
}

const DocsPage = () => {
  // TODO: Replace with actual DocsListing component when available
  // DocsListing should handle fetching internally
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Complete guides and reference documentation for our platform
      </p>
      <p className="text-muted-foreground">
        Documentation listing will be available here.
      </p>
    </div>
  );
};

export default DocsPage;
