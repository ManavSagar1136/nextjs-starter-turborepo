import { getServerSideSitemapIndex } from "next-sitemap";
import { SiteConfig } from "@/config";
import { Routes } from "@/data/routes";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = SiteConfig.baseUrl;

  return getServerSideSitemapIndex([
    `${siteUrl}${Routes.blogs}/sitemap-posts.xml`,
    `${siteUrl}${Routes.blogTags}/sitemap.xml`,
  ]);
}
