import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { compareDesc } from "date-fns";

import { IBlogPost } from "@/services/blogs";

import { Suspense } from "react";
import { SiteConfig } from "@/config";
import {
  adaptBlogPost,
  adaptTag,
  extractSlugPart,
} from "@/lib/blogs/blog-adapter";
import { BlogFolderService } from "@/lib/blogs/blog-folder.service";
import { API } from "@/services";

import BlogRenderer from "@/components/blog/BlogRenderer";
import { BlogContentServer } from "@/components/blog/BlogContentServer";
import BlogMarkdownContent from "@/components/blog/BlogMarkdownContent";
import BlogsGroup from "@/components/blog/BlogsGroup";

// Force static generation
export const dynamic = "force-static";
export const revalidate = 3600;

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

    // Flatten folder tree structure, computing full paths from hierarchy
    // The API returns `children` (not `subFolders`), and `path` may be null for nested folders
    const flattenFolders = (folders: any[], parentPath = ""): any[] => {
      const result: any[] = [];
      folders.forEach((folder) => {
        const computedPath = folder.path || (parentPath ? `${parentPath}/${folder.slug}` : folder.slug);
        result.push({ ...folder, _fullPath: computedPath });
        const nested = folder.children || folder.subFolders;
        if (nested?.length) {
          result.push(...flattenFolders(nested, computedPath));
        }
      });
      return result;
    };
    const allFolders = flattenFolders(folders);

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

    // Generate paths for all folders using the computed full path
    const folderParams = allFolders.map((folder: any) => {
      const path = folder._fullPath || folder.path || folder.slug || folder.id;
      const slugArray = typeof path === "string" ? path.split("/") : [path];
      return {
        slug: slugArray,
      };
    });

    // Combine both blogs and folders
    return [...blogParams, ...folderParams];
  } catch (error: any) {
    // Only log non-connection errors to reduce build noise
    const errorCode = error?.code || error?.cause?.code;
    if (errorCode !== "ECONNREFUSED") {
      console.error("Error generating static params for blogs:", {
        message: error?.message || error?.data?.message || "Unknown error",
        code: errorCode,
      });
    }
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
      const authorNames = post.authors?.map((a: any) => (a.author || a)?.name).filter(Boolean) as string[] | undefined;
      const tagTitles = post.tags?.map((t: any) => (t.tag || t)?.title).filter(Boolean) as string[] | undefined;
      return generateSEOMetadata({
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.description,
        url: `${SiteConfig.baseUrl}${Routes.blogs}/${path}`,
        type: "article",
        image: post.image || `${SiteConfig.baseUrl}/og.jpg`,
        keywords: [
          ...(post.seoKeywords || []),
          ...(tagTitles || []),
        ],
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        authors: authorNames,
        section: post.folder?.name,
        articleTags: tagTitles,
      });
    }

    // Try to get as folder
    const folder = await BlogFolderService.getFolderByPath(path, false);

    if (folder) {
      const folderName = folder.name;
      const folderUrl = `${SiteConfig.baseUrl}${Routes.blogs}/${path}`;
      return generateSEOMetadata({
        title: `${folderName} - Blog`,
        description: `Explore blog posts about ${folderName.toLowerCase()}. Comprehensive articles and tutorials to help you master the topic.`,
        url: folderUrl,
        type: "website",
        keywords: [folderName],
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

    if (post && post.published) {
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

      return (
        <BlogRenderer
          post={blogPost}
          similarBlogs={relatedBlogs}
          allTags={allTags}
        >
          <BlogContentServer post={blogPost} allTags={allTags} />
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400 dark:text-slate-600">Loading content...</div>
              </div>
            }
          >
            <BlogMarkdownContent
              content={blogPost.content || ""}
              postTitle={blogPost.title}
            />
          </Suspense>
        </BlogRenderer>
      );
    }

    // Try to get as folder (with sub-folders preserved)
    const folder = await BlogFolderService.getFolderWithChildren(path);

    if (folder) {
      // Get all published posts directly in this folder and sub-folders in parallel
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

      return (
        <BlogsGroup
          blogs={groupBlogs}
          allTags={allTags}
          groupName={folder.path || folder.slug}
          subFolders={folder.subFolders ?? []}
          folderName={folder.name}
        />
      );
    }
  } catch (error: any) {
    // Log error details for debugging
    const errorMessage = error?.message || error?.data?.message || "Unknown error";
    const errorStatus = error?.status || error?.response?.status || error?.statusCode;
    
    // Only log if it's not a 404 (which is expected for not found posts/folders)
    if (errorStatus !== 404) {
      console.error("Error fetching blog post:", {
        message: errorMessage,
        status: errorStatus,
        path,
        error: error instanceof Error ? error : String(error),
      });
    }
  }

  // Not found
  return notFound();
}

export default PostPage;
