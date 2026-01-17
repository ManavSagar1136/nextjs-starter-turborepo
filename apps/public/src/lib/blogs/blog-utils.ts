/**
 * Blog-specific utility functions
 * These utilities work with API-based blog data
 */

import { formatGroupName } from "@buildbase/utils/path-utils";

import { IBlogPost, IBlogTag } from "@/services/blogs";

import { extractSlugPart } from "./blog-adapter";

// Re-export formatGroupName for backward compatibility
export { formatGroupName };

/**
 * Extracts path parts from a blog slug, removing the blogs prefix.
 *
 * @param slugAsParams - The slug path (e.g., "/blogs/tech/react/my-post" or "tech/react/my-post")
 * @param stripPrefixes - Optional array of prefixes to strip (e.g., ["blogs"])
 * @returns Object with normalized path and parts array
 *
 * @example
 * extractBlogPathParts("/blogs/tech/react/my-post", ["blogs"])
 * // Returns: { path: "tech/react/my-post", parts: ["tech", "react", "my-post"] }
 */
export function extractBlogPathParts(
  slugAsParams: string,
  stripPrefixes: string[] = [],
): { path: string; parts: string[] } {
  let path = slugAsParams.trim();

  // Remove leading/trailing slashes
  path = path.replace(/^\/+|\/+$/g, "");

  // Strip prefixes
  for (const prefix of stripPrefixes) {
    const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");
    if (path.startsWith(`${normalizedPrefix}/`)) {
      path = path.slice(normalizedPrefix.length + 1);
    } else if (path === normalizedPrefix) {
      path = "";
    }
  }

  // Split into parts
  const parts = path ? path.split("/").filter(Boolean) : [];

  return { path, parts };
}

/**
 * Filter blog posts based on optional search query, tags, and folder.
 * All filters are optional - if all are empty, returns all posts.
 *
 * @param posts - Array of blog posts to filter
 * @param options - Filter options
 * @param options.search - Optional search query to match against title, description, and excerpt
 * @param options.selectedTags - Optional array of tag slugs to filter by
 * @param options.folderId - Optional folder ID to filter by
 * @param options.folderPath - Optional folder path to filter by
 * @param options.allTags - Array of all available tags (required for tag filtering)
 * @returns Filtered array of blog posts
 *
 * @example
 * // Filter by search only
 * filterBlogPosts(posts, { search: "react", allTags });
 *
 * @example
 * // Filter by tags only
 * filterBlogPosts(posts, { selectedTags: ["tag1", "tag2"], allTags });
 *
 * @example
 * // Filter by folder
 * filterBlogPosts(posts, { folderId: "folder123", allTags });
 *
 * @example
 * // All filters empty - returns all posts
 * filterBlogPosts(posts, { allTags });
 */
export function filterBlogPosts(
  posts: IBlogPost[],
  options: {
    search?: string;
    selectedTags?: string[];
    folderId?: string;
    folderPath?: string;
    allTags: IBlogTag[];
  },
): IBlogPost[] {
  const {
    search = "",
    selectedTags = [],
    folderId,
    folderPath,
    allTags,
  } = options;

  // Normalize search query once
  const normalizedQuery = search.trim().toLowerCase();

  // Pre-compute selected tag IDs and slug parts for O(1) lookup
  const selectedTagIds = new Set<string>();
  const selectedTagSlugParts = new Set<string>();

  // Populate selectedTagIds and selectedTagSlugParts
  if (selectedTags.length > 0) {
    selectedTags.forEach((selectedTagSlug) => {
      const selectedSlugPart = extractSlugPart(selectedTagSlug).toLowerCase();
      const selectedTag = allTags.find(
        (tag) => extractSlugPart(tag.slug).toLowerCase() === selectedSlugPart,
      );
      if (selectedTag) {
        if (selectedTag.id) selectedTagIds.add(selectedTag.id);
        selectedTagSlugParts.add(selectedSlugPart);
      }
    });
  }

  const hasTagFilter = selectedTags.length > 0;
  const hasSearchFilter = normalizedQuery.length > 0;
  const hasFolderFilter = folderId !== undefined || folderPath !== undefined;

  // If no filters are applied, return all posts
  if (!hasSearchFilter && !hasTagFilter && !hasFolderFilter) {
    return posts;
  }

  return posts.filter((post) => {
    // Search matching text fields (title, description, excerpt)
    if (hasSearchFilter) {
      const searchableText = [post.title, post.description, post.excerpt]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!searchableText.includes(normalizedQuery)) return false;
    }

    // Tag matching
    if (hasTagFilter) {
      if (post.tags?.length) {
        const hasMatchingTag = post.tags.some((tag) => {
          if (tag.id && selectedTagIds.has(tag.id)) return true;
          const tagSlugPart = extractSlugPart(tag.slug).toLowerCase();
          return selectedTagSlugParts.has(tagSlugPart);
        });
        if (!hasMatchingTag) return false;
      } else {
        // If tag filter is active but post has no tags, exclude it
        return false;
      }
    }

    // Folder matching
    if (hasFolderFilter) {
      if (folderId !== undefined) {
        // Filter by folder ID
        if (post.folderId !== folderId) return false;
      } else if (folderPath !== undefined) {
        // Filter by folder path
        if (!post.folder?.path) return false;
        // Match exact path or if the post's folder path starts with the filter path
        const postFolderPath = post.folder.path.toLowerCase();
        const filterPath = folderPath.toLowerCase();
        if (
          postFolderPath !== filterPath &&
          !postFolderPath.startsWith(`${filterPath}/`)
        ) {
          return false;
        }
      }
    }

    return true;
  });
}
