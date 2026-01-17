import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import { adaptBlogPost, adaptTag } from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

import BlogExplorer from "@/components/blog/BlogExplorer";

// Force static generation
export const dynamic = "force-static";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Groups",
    description:
      "App Blog: Explore articles organized by categories. Browse our collection of guides, tutorials, and insights grouped by topics.",
    url: `${SiteConfig.baseUrl}${Routes.blogGroups}`,
  });
}

export default async function BlogGroups() {
  try {
    // Fetch folders directly, published posts, and public tags from API
    const [foldersResult, postsResult, tagsResult] = await Promise.all([
      API.blogs.getFolders({ tree: true }),
      API.blogs.getAllPublished({
        $page: 1,
        $limit: 10000,
        sorting: [{ id: "publishedAt", desc: true }],
      }),
      API.blogs.getTags({
        $page: 1,
        $limit: 10000,
      }),
    ]);

    const allFolders = Array.isArray(foldersResult) ? foldersResult : [];
    const postsData = Array.isArray(postsResult)
      ? postsResult
      : postsResult?.data || postsResult?.docs || [];
    const tagsData = Array.isArray(tagsResult) ? tagsResult : tagsResult || [];

    const allBlogs = postsData.map((post: any) => adaptBlogPost(post));
    const allTags = tagsData.map((tag: any) => adaptTag(tag));

    return (
      <BlogExplorer
        mode="groups"
        allTags={allTags}
        allBlogs={allBlogs}
        allFolders={allFolders.map((f: any) => ({
          id: f.id,
          name: f.name,
          slug: f.slug || "",
          path: f.path || f.slug || "",
          parentFolderId: f.parentFolderId,
        }))}
      />
    );
  } catch (error: any) {
    // Log error details for debugging (only non-connection errors)
    const errorCode = error?.code || error?.cause?.code;
    if (errorCode !== "ECONNREFUSED") {
      console.error("Error fetching blog groups data:", {
        message: error?.message || error?.data?.message || "Unknown error",
        code: errorCode,
      });
    }
    
    // Return empty state to allow build to continue
    return (
      <BlogExplorer
        mode="groups"
        allTags={[]}
        allBlogs={[]}
        allFolders={[]}
      />
    );
  }
}
