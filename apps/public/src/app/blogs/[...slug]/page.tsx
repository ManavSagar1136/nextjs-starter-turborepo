import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { compareDesc } from "date-fns";

import { IBlogPost } from "@/services/blogs";

import { SiteConfig } from "@/config";
import {
  adaptBlogPost,
  adaptTag,
  extractSlugPart,
} from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

// Force static generation
export const dynamic = "force-static";

/**
 * Generates all possible static paths for blog posts and folders.
 * Used by Next.js for static generation at build time.
 */
export async function generateStaticParams() {
  try {
    const [postsResult, foldersResult] = await Promise.all([
      API.blogs.getAllPublished({
        $page: 1,
        $limit: 10000,
      }),
      API.blogs.getFolders({
        tree: true,
      }),
    ]);

    const posts = Array.isArray(postsResult)
      ? postsResult
      : postsResult?.data || postsResult?.docs || [];
    const folders = Array.isArray(foldersResult) ? foldersResult : [];

    // Generate paths for all blog posts
    const blogParams = posts.map((post: any) => {
      // Extract slug from post - handle both full path and slug
      const slug = post.slug || post.path || post.id;
      // If slug is a full path like "/blogs/tech/react", extract the path part
      const slugPath = typeof slug === "string" 
        ? slug.replace(/^\/blogs\//, "").split("/")
        : [slug];
      return {
        slug: slugPath,
      };
    });

    // Generate paths for all folders
    const folderParams = folders.map((folder: any) => {
      const path = folder.path || folder.slug || folder.id;
      const slugArray = typeof path === "string" ? path.split("/") : path;
      return {
        slug: slugArray,
      };
    });

    // Combine both blogs and folders
    return [...blogParams, ...folderParams];
  } catch (error) {
    console.error("Error generating static params for blogs:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const paramsResolved = await params;
  const slugArray = paramsResolved.slug;
  const path = slugArray.join("/");

  try {
    // Try to get as blog post first
    const post = await API.blogs.getByPath(path);

    if (post && post.published) {
      // Return SEO metadata for an individual blog post
      return generateSEOMetadata({
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.description,
        url: `${SiteConfig.baseUrl}${Routes.blogs}/${path}`,
        type: "article",
        image: post.image || `${SiteConfig.baseUrl}/og.jpg`,
        keywords: post.seoKeywords || [],
      });
    }

    // Try to get as folder
    const folders = await API.blogs.getFolders({ tree: true });
    const allFolders = Array.isArray(folders) ? folders : [];
    const folder = allFolders.find(
      (f: any) => f.path === path || f.slug === path
    );

    if (folder) {
      const folderName = folder.name;
      const folderUrl = `${SiteConfig.baseUrl}${Routes.blogs}/${path}`;
      return generateSEOMetadata({
        title: `${folderName} - Blog`,
        description: `Explore blog posts about ${folderName.toLowerCase()}. Comprehensive articles and tutorials to help you master the topic.`,
        url: folderUrl,
        type: "website",
      });
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  // Not found
  return notFound();
}

async function PostPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const paramsResolved = await params;
  const slugArray = paramsResolved.slug;
  const path = slugArray.join("/");

  try {
    // Fetch all tags for filtering
    const tagsResult = await API.blogs.getTags({
      $page: 1,
      $limit: 1000,
    });
    const tagsData = Array.isArray(tagsResult) ? tagsResult : tagsResult || [];
    const allTags = tagsData.map((tag: any) => adaptTag(tag));

    // Try to get as blog post first
    const post = await API.blogs.getByPath(path);

    if (post) {
      // Only show published posts
      if (!post.published) {
        return notFound();
      }

      // Render a blog post page
      // Extract tag slugs from API nested structure: { tag: IBlogTag }[]
      const tags =
        post.tags
          ?.map((t: any) => {
            const tag = t.tag || t; // Handle both nested and direct structures
            // Extract slug part if it's a full path, otherwise use as-is
            return extractSlugPart(tag.slug);
          })
          .filter(Boolean) || [];

      // Priority 1: Use suggested blogs from admin if available
      let relatedBlogs: IBlogPost[] = [];

      if (post.suggestedPosts && post.suggestedPosts.length > 0) {
        // Use suggested blogs (only published ones)
        // suggestedPosts is an array of { suggestedPost: BlogPost } objects
        relatedBlogs = post.suggestedPosts
          .map((sp: any) => sp.suggestedPost)
          .filter((p: any) => p && p.published && !p.deleted)
          .slice(0, 4)
          .map((p: any) => adaptBlogPost(p));
      }

      // Priority 2: If not enough suggested blogs, fill with similar blogs by tags
      if (relatedBlogs.length < 4) {
        const similarPostsResult = await API.blogs.getAllPublished({
          $page: 1,
          $limit: 100,
          sorting: [{ id: "publishedAt", desc: true }],
        });

        const suggestedIds = new Set(
          post.suggestedPosts
            ?.map((sp: any) => sp.suggestedPost?.id)
            .filter(Boolean) || [],
        );

        const allPosts = Array.isArray(similarPostsResult)
          ? similarPostsResult
          : similarPostsResult?.data || similarPostsResult?.docs || [];

        const similarBlogs = allPosts
          .filter((p: any) => {
            if (p.id === post.id) return false;
            if (suggestedIds.has(p.id)) return false; // Don't duplicate suggested blogs

            // Extract tag slugs from API nested structure and compare
            const postTags =
              p.tags
                ?.map((t: any) => {
                  const tag = t.tag || t;
                  return extractSlugPart(tag.slug);
                })
                .filter(Boolean) || [];

            // Check if any tags match
            const commonTags = postTags.some((tagSlug: string) =>
              tags.includes(tagSlug),
            );
            return commonTags;
          })
          .slice(0, 4 - relatedBlogs.length)
          .map((p: any) => adaptBlogPost(p));

        relatedBlogs = [...relatedBlogs, ...similarBlogs];
      }

      const blogPost = adaptBlogPost(post);

      // TODO: Replace with actual BlogRenderer component when available
      return (
        <div className="container mx-auto py-8 max-w-4xl">
          <article>
            <h1 className="text-4xl font-bold mb-4">{blogPost.title}</h1>
            {blogPost.description && (
              <p className="text-xl text-muted-foreground mb-6">
                {blogPost.description}
              </p>
            )}
            {blogPost.image && (
              <img
                src={blogPost.image}
                alt={blogPost.imageTitle || blogPost.title}
                className="w-full rounded-lg mb-8"
              />
            )}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {/* TODO: Replace with MarkdownView component when available */}
              <div dangerouslySetInnerHTML={{ __html: blogPost.content }} />
            </div>
          </article>

          {relatedBlogs.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="text-2xl font-bold mb-4">Related Posts</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedBlogs.map((relatedPost) => (
                  <a
                    key={relatedPost.id}
                    href={relatedPost.slug}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    <h3 className="font-semibold mb-2">{relatedPost.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {relatedPost.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Try to get as folder
    const folders = await API.blogs.getFolders({ tree: true });
    const allFolders = Array.isArray(folders) ? folders : [];
    const folder = allFolders.find(
      (f: any) => f.path === path || f.slug === path
    );

    if (folder) {
      // Get all published posts in this folder
      const folderPostsResult = await API.blogs.getAllPublished({
        $page: 1,
        $limit: 1000,
        folderId: folder.id,
        sorting: [{ id: "publishedAt", desc: true }],
      });

      const folderPosts = Array.isArray(folderPostsResult)
        ? folderPostsResult
        : folderPostsResult?.data || folderPostsResult?.docs || [];

      const groupBlogs = folderPosts
        .filter((p: any) => p.publishedAt)
        .sort((a: any, b: any) => {
          const dateA = a.publishedAt || a.createdAt;
          const dateB = b.publishedAt || b.createdAt;
          return compareDesc(new Date(dateA), new Date(dateB));
        })
        .map((p: any) => adaptBlogPost(p));

      // TODO: Replace with actual BlogsGroup component when available
      return (
        <div className="container mx-auto py-8">
          <h1 className="text-4xl font-bold mb-4">
            {folder.path || folder.slug}
          </h1>
          <div className="grid gap-6">
            {groupBlogs.length === 0 ? (
              <p className="text-muted-foreground">
                No blog posts in this category.
              </p>
            ) : (
              groupBlogs.map((blog) => (
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
    }
  } catch (error) {
    console.error("Error fetching blog post:", error);
  }

  // Not found
  return notFound();
}

export default PostPage;
