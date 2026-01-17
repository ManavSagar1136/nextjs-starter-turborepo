import { Routes } from "@/data/routes";

import { IBlogFolder } from "@/services/blogs";

/**
 * Compute the URL path for a blog post
 * Format: /blogs/{folderPath}/{slug}
 * If no folder: /blogs/{slug}
 */
export function computePostUrl(post: any): string {
  if (post.folder && post.folder.path) {
    return `${Routes.blogs}/${post.folder.path}/${post.slug}`;
  }
  return `${Routes.blogs}/${post.slug}`;
}

/**
 * Compute the URL path for a blog folder
 * Format: /blogs/{folderPath}
 */
export function computeFolderUrl(folder: IBlogFolder): string {
  if (folder.path) {
    return `${Routes.blogs}/${folder.path}`;
  }
  return `${Routes.blogs}/${folder.slug}`;
}

/**
 * Parse a blog post path into folder path and slug
 * Input: "tech/react/hooks" or "hooks"
 * Output: { folderPath: "tech/react", slug: "hooks" } or { folderPath: null, slug: "hooks" }
 */
export function parsePostPath(path: string): {
  folderPath: string | null;
  slug: string;
} {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) {
    throw new Error("Invalid path: empty path");
  }
  if (parts.length === 1) {
    return { folderPath: null, slug: parts[0] || "" };
  }
  const slug = parts[parts.length - 1];
  const folderPath = parts.slice(0, -1).join("/");
  return { folderPath: folderPath || null, slug: slug || "" };
}

/**
 * Build a blog post path from folder path and slug
 * Input: folderPath: "tech/react", slug: "hooks"
 * Output: "tech/react/hooks"
 */
export function buildPostPath(folderPath: string | null, slug: string): string {
  if (folderPath) {
    return `${folderPath}/${slug}`;
  }
  return slug;
}
