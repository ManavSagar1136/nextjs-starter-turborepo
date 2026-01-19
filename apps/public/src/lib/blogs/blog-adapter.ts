/**
 * Adapter to convert API blog posts to Blog format
 * This allows us to reuse existing UI components without major refactoring
 */

import { Routes } from "@/data/routes";

import {
  IBlogAuthor,
  IBlogFolder,
  IBlogPost,
  IBlogTag,
} from "@/services/blogs";

import { computePostUrl } from "./blog-url.service";

/**
 * Extract just the slug part (last segment) from a full path or slug.
 * Handles cases where the slug might be a full path like "/blogs/tags/authentication"
 * or just the slug part like "authentication"
 *
 * @param slug - The slug string (can be a full path or just the slug part)
 * @returns The extracted slug part (last segment after the last "/")
 */
export function extractSlugPart(slug: string | null | undefined): string {
  if (!slug) return "";
  return slug.includes("/") ? slug.split("/").pop() || slug : slug;
}


/**
 * Flexible type for blog post with optional relations
 * Used when not all relations are loaded (e.g., from API responses)
 */
type BlogPostWithPartialRelations = IBlogPost & {
  folder?: IBlogFolder | null;
  assetFile?: any;
  // API nested structure for junction tables
  authors?: Array<{ author: IBlogAuthor }> | Array<IBlogAuthor>;
  tags?: Array<{ tag: IBlogTag }> | Array<IBlogTag>;
  suggestedPosts?: Array<{ suggestedPost: any }> | Array<IBlogPost>;
  creator?: Pick<
    { id: string; name: string | null; email: string | null },
    "id" | "name" | "email"
  >;
  updatedBy?: Pick<
    { id: string; name: string | null; email: string | null },
    "id" | "name" | "email"
  > | null;
  url?: string;
};

/**
 * Convert API blog post to Blog format
 * Accepts a BlogPost with optional relations and converts it to UI-compatible Blog format
 */
export function adaptBlogPost(
  post: (BlogPostWithPartialRelations | IBlogPost) & {
    url?: string;
  },
): IBlogPost & { url?: string } {
  // Compute the full URL if not already provided
  const computedUrl =
    post.url ||
    computePostUrl(post as IBlogPost & { folder?: IBlogFolder | null });

  // Extract tags from API nested structure or use direct array
  const tags = post.tags
    ? post.tags.map((t: any) => {
        // Handle both nested structure { tag: IBlogTag } and direct IBlogTag
        return t.tag || t;
      })
    : [];

  // Extract authors from API nested structure or use direct array
  const authors = post.authors
    ? post.authors
        .map((a: any) => {
          // Handle both nested structure { author: IBlogAuthor } and direct IBlogAuthor
          return a.author || a;
        })
        .filter((a): a is IBlogAuthor => Boolean(a))
    : [];

  return {
    // API fields
    id: post.id,
    title: post.title,
    slug: post.slug, // Keep original slug (not the full URL)
    description: post.description,
    excerpt: post.excerpt || undefined,
    content: post.content,
    image: post.image || undefined,
    imageTitle: post.imageTitle || undefined,
    featured: post.featured,
    featuredAt: post.featuredAt || undefined,
    published: post.published,
    publishedAt: post.publishedAt || undefined,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    seoKeywords: post.seoKeywords || [],
    tags,
    authors,
    folderId: post.folderId,
    folder: post.folder || undefined, // Preserve folder object for groups extraction
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    url: computedUrl, // Store the full URL in the url property
  };
}

/**
 * Convert API tag to Tag format
 * Accepts a BlogTag and converts it to UI-compatible Tag format
 * Handles both raw slug (from API) and full path (already processed)
 */
export function adaptTag(tag: IBlogTag): IBlogTag & { url?: string } {
  // Extract slug part if it's already a full path, otherwise use as-is
  const slugPart = extractSlugPart(tag.slug);
  const computedUrl = `${Routes.blogTags}/${slugPart}`;

  return {
    id: tag.id,
    title: tag.title,
    slug: slugPart, // Keep original slug part (not the full URL)
    url: computedUrl, // Store the full URL in the url property
    isPublic: tag.isPublic,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

/**
 * Returns the complete Tag objects for a given blog post, matched by slug.
 * This is a utility function to map blog tag slugs to full Tag objects.
 *
 * @param blog - The blog post for which to retrieve tags.
 * @param allTags - An array of all available Tag objects.
 * @returns Tag[] - An array of Tag objects that are associated with the blog.
 */
export function getBlogTags(blog: IBlogPost, allTags: IBlogTag[]): IBlogTag[] {
  // If the blog has no tags, return an empty array.
  if (!blog.tags?.length) return [];

  // Create a map for quick lookup of tags by their slug value.
  // Note: allTags have full URL paths in slug (e.g., "/blogs/tags/my-tag")
  // while blog.tags might have just the slug part (e.g., "my-tag")
  // So we need to extract the slug part from the full path for matching
  const tagMap = new Map(
    allTags.map((tag) => {
      // Extract slug part from full path (e.g., "/blogs/tags/my-tag" -> "my-tag")
      const slugPart = extractSlugPart(tag.slug);
      return [slugPart, tag];
    }),
  );

  // Map blog tag slugs to Tag objects, filtering out any that don't exist in allTags.
  return blog.tags
    .map((tag: IBlogTag) => {
      // Extract slug part from tag (might be full path or just slug)
      const tagSlug = extractSlugPart(tag.slug);
      return tagMap.get(tagSlug);
    })
    .filter((tag): tag is IBlogTag => Boolean(tag));
}
