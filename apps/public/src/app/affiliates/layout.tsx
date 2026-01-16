import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Affiliates",
    description: "Join our affiliate program and earn recurring commissions",
    url: `${SiteConfig.baseUrl}${Routes.affiliates}`,
  });
}

export default function AffiliatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
