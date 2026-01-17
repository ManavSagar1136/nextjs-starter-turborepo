import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import { adaptBlogPost, adaptTag } from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

import BlogWrapper from "@/components/blog/BlogWrapper";

// Force static generation
export const dynamic = "force-static";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Blogs",
    description:
      "App Blog: Explore Tips, Techniques, and Inspiration for Visual Content Creation.",
    url: `${SiteConfig.baseUrl}${Routes.blogs}`,
  });
}

const BlogsPage = async () => {
  // Fetch all published posts and tags from API
  const [postsResult, tagsResult] = await Promise.all([
    API.blogs.getAllPublished({
      $page: 1,
      $limit: 1000,
      sorting: [{ id: "publishedAt", desc: true }],
    }),
    API.blogs.getTags({
      $page: 1,
      $limit: 1000,
    }),
  ]);

  // Handle API response format - convert to base template format
  const postsData = Array.isArray(postsResult)
    ? postsResult
    : postsResult?.data || postsResult?.docs || [];
  const tagsData = Array.isArray(tagsResult) ? tagsResult : tagsResult || [];

  // Convert API posts to UI-compatible Blog format (matching base template)
  const allBlogs = postsData.map((post: any) => adaptBlogPost(post));

  // Convert API tags to UI-compatible Tag format (matching base template)
  const allTags = tagsData.map((tag: any) => adaptTag(tag));

  return <BlogWrapper allTags={allTags} allBlogs={allBlogs} />;
};

export default BlogsPage;
