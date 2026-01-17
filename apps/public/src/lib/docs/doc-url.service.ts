import { Routes } from "@/data/routes";

import { IDocFolder } from "@/services/docs";

/**
 * Compute the URL path for a document
 * Format: /docs/{folderPath}/{slug}
 * If no folder: /docs/{slug}
 */
export function computeDocUrl(post: any): string {
  if (post.folder && post.folder.path) {
    return `${Routes.docs}/${post.folder.path}/${post.slug}`;
  }
  return `${Routes.docs}/${post.slug}`;
}

/**
 * Compute the URL path for a document folder
 * Format: /docs/{folderPath}
 */
export function computeFolderUrl(folder: IDocFolder): string {
  if (folder.path) {
    return `${Routes.docs}/${folder.path}`;
  }
  return `${Routes.docs}/${folder.slug}`;
}

/**
 * Parse a document path into folder path and slug
 * Input: "guides/api/integration" or "integration"
 * Output: { folderPath: "guides/api", slug: "integration" } or { folderPath: null, slug: "integration" }
 */
export function parseDocPath(path: string): {
  folderPath: string | null;
  slug: string;
} {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) {
    throw new Error("Invalid path: empty path");
  }
  if (parts.length === 1) {
    return { folderPath: null, slug: parts[0] };
  }
  const slug = parts[parts.length - 1];
  const folderPath = parts.slice(0, -1).join("/");
  return { folderPath, slug };
}

/**
 * Build a document path from folder path and slug
 * Input: folderPath: "guides/api", slug: "integration"
 * Output: "guides/api/integration"
 */
export function buildDocPath(folderPath: string | null, slug: string): string {
  if (folderPath) {
    return `${folderPath}/${slug}`;
  }
  return slug;
}
