import { getServerSideSitemap } from "next-sitemap";

import { Routes } from "@/data/routes";
import { SiteConfig } from "@/config";
import { ChangelogPostService } from "@/lib/changelogs/changelog-post.service";

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

  const result = await ChangelogPostService.listChangelogPosts({
    published: true,
    includeDeleted: false,
    limit: 10000,
  });
  const allChangelogs = result.posts || [];

  const changelogEntries = allChangelogs.map((item: any) => ({
    loc: `${siteUrl}${item.url || `${Routes.changelogs}/${item.slug}`}`,
    lastmod: safeIso(item.publishedAt, item.updatedAt, item.createdAt),
    changefreq: "daily" as const,
    priority: 0.7,
  }));

  return getServerSideSitemap(changelogEntries);
}
