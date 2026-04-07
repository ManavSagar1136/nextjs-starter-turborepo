import { getServerSideSitemap } from "next-sitemap";
import { SiteConfig } from "@/config";
import { Routes } from "@/data/routes";
import { API } from "@/services";

export const dynamic = "force-dynamic";

const safeIso = (...vals: unknown[]): string => {
  for (const v of vals) {
    if (!v) continue;
    const d = new Date(v as any);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
};

export async function GET() {
  const siteUrl = SiteConfig.baseUrl;

  const tagsResult = await API.blogs.getTags({ $page: 1, $limit: 10000 }).catch(() => []);
  const tags = Array.isArray(tagsResult) ? tagsResult : [];

  const entries = tags.map((tag) => ({
    loc: `${siteUrl}${tag.url ?? Routes.blogTag(tag.slug)}`,
    lastmod: safeIso(tag.updatedAt, tag.createdAt),
    changefreq: "weekly" as const,
    priority: 0.6,
  }));

  return getServerSideSitemap(entries);
}
