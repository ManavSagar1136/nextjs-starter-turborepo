import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import DocsListing from "@/components/doc/DocsListing";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Documentation",
    description: "Complete guides and reference documentation for our platform",
    url: `${SiteConfig.baseUrl}${Routes.docs}`,
  });
}

const DocsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) => {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  return (
    <DocsListing
      title="Documentation"
      description="Complete guides and reference documentation for our platform"
      page={page}
    />
  );
};

export default DocsPage;
