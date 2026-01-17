import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";

import { SiteConfig } from "@/config";
import { adaptBlogPost, adaptTag } from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

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

  // TODO: Replace with actual BlogExplorer component when available
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Blog Groups</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {allFolders.map((folder: any) => (
          <a
            key={folder.id}
            href={`${Routes.blogs}/${folder.path || folder.slug}`}
            className="border rounded-lg p-6 hover:bg-accent transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">{folder.name}</h2>
            <p className="text-sm text-muted-foreground">
              {folder.path || folder.slug}
            </p>
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
