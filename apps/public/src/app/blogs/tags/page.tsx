import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import { adaptBlogPost, adaptTag } from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

import BlogExplorer from "@/components/blog/BlogExplorer";

// Force static generation
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Tags",
    description:
      "App Blog: Explore Tips, Techniques, and Inspiration for Visual Content Creation.",
    url: `${SiteConfig.baseUrl}${Routes.blogTags}`,
  });
}

export default async function BlogTags() {
  try {
    // Fetch all published posts and public tags from API
    const [postsResult, tagsResult] = await Promise.all([
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

    const postsData = Array.isArray(postsResult)
      ? postsResult
      : postsResult?.data || postsResult?.docs || [];
    const tagsData = Array.isArray(tagsResult) ? tagsResult : tagsResult || [];

    const allBlogs = postsData.map((post: any) => adaptBlogPost(post));
    const allTags = tagsData.map((tag: any) => adaptTag(tag));

    return <BlogExplorer allTags={allTags} allBlogs={allBlogs} />;
  } catch (error: any) {
    // Log error details for debugging (only non-connection errors)
    const errorCode = error?.code || error?.cause?.code;
    if (errorCode !== "ECONNREFUSED") {
      console.error("Error fetching blog tags data:", {
        message: error?.message || error?.data?.message || "Unknown error",
        code: errorCode,
      });
    }
    
    // Return empty state to allow build to continue
    return <BlogExplorer allTags={[]} allBlogs={[]} />;
  }
}
