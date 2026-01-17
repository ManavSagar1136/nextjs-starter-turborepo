import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import { adaptBlogPost, adaptTag, extractSlugPart } from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

// Force static generation
export const dynamic = "force-static";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Tags",
    description:
      "App Blog: Explore Tips, Techniques, and Inspiration for Visual Content Creation.",
    url: `${SiteConfig.baseUrl}${Routes.blogTags}`,
  });
}

export default async function BlogTags() {
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

  // TODO: Replace with actual BlogExplorer component when available
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Blog Tags</h1>
      <div className="flex flex-wrap gap-2 mb-8">
        {allTags.map((tag) => (
          <a
            key={tag.id}
            href={`${Routes.blogTags}/${extractSlugPart(tag.slug)}`}
            className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
          >
            {tag.title}
          </a>
        ))}
      </div>
      <div className="grid gap-6">
        {allBlogs.map((blog) => (
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
        ))}
      </div>
    </div>
  );
}
