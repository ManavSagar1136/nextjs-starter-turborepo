import { getServerSideSitemap } from "next-sitemap";
import { SiteConfig } from "@/config";
import { Routes } from "@/data/routes";
import { API } from "@/services";

const safeIso = (...vals: unknown[]): string => {
  for (const v of vals) {
    if (!v) continue;
    const d = new Date(v as any);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
};

export const dynamic = "force-dynamic";

const flattenFolders = (folders: any[], parentPath = ""): any[] => {
  const result: any[] = [];
  for (const folder of folders) {
    const computedPath =
      folder.path ?? (parentPath ? `${parentPath}/${folder.slug}` : folder.slug);
    result.push({ ...folder, _fullPath: computedPath });
    const children = folder.children ?? folder.subFolders ?? [];
    if (children.length) result.push(...flattenFolders(children, computedPath));
  }
  return result;
};

export async function GET() {
  const siteUrl = SiteConfig.baseUrl;

  const [postsResult, foldersResult] = await Promise.allSettled([
    API.docs.getAllPublished({ $page: 1, $limit: 10000 }),
    API.docs.getFolders({ tree: true }),
  ]);

  const posts =
    postsResult.status === "fulfilled"
      ? (postsResult.value?.data ?? postsResult.value?.docs ?? postsResult.value ?? [])
      : [];

  const folders =
    foldersResult.status === "fulfilled"
      ? flattenFolders(Array.isArray(foldersResult.value) ? foldersResult.value : [])
      : [];

  const postEntries = (posts as any[]).map((post) => ({
    loc: `${siteUrl}${post.url ?? Routes.docPost(post.slug)}`,
    lastmod: safeIso(post.updatedAt, post.publishedAt, post.createdAt),
    changefreq: "monthly" as const,
    priority: 0.8,
  }));

  const folderEntries = folders.map((folder) => ({
    loc: `${siteUrl}${Routes.docGroup(folder._fullPath)}`,
    lastmod: safeIso(folder.updatedAt, folder.createdAt),
    changefreq: "monthly" as const,
    priority: 0.7,
  }));

  return getServerSideSitemap([...postEntries, ...folderEntries]);
}
