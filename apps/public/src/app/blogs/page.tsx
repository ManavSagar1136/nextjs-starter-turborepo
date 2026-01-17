import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import { adaptBlogPost, adaptTag } from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

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

  // TODO: Replace with actual BlogWrapper component when available
  // For now, using placeholder that matches structure
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Blogs</h1>
      <div className="grid gap-6">
        {allBlogs.length === 0 ? (
          <p className="text-muted-foreground">No blog posts available.</p>
        ) : (
          allBlogs.map((blog) => (
            <div key={blog.id} className="border rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">{blog.title}</h2>
              <p className="text-muted-foreground mb-4">{blog.description}</p>
              <a
                href={blog.slug}
                className="text-primary hover:underline"
              >
                Read more →
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogsPage;
