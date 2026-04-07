import { Routes } from "@/data/routes";

/**
 * Generate a URL-friendly slug from a version string.
 * Always adds "v" prefix to the slug.
 * Examples:
 * - "3.0.0" -> "v3.0.0"
 * - "v3.0.0" -> "v3.0.0" (no duplicate "v")
 * - "2.1.0-beta" -> "v2.1.0-beta"
 */
export function generateSlugFromVersion(version: string): string {
  if (!version) return "";

  // Remove any existing "v" prefix to avoid duplicates
  const cleaned = version.trim().replace(/^v/i, "");

  const normalized = cleaned
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.\-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/^-|-$/g, "")
    .replace(/^\.|\.$/g, "");

  if (!normalized) {
    throw new Error(`Cannot generate a valid slug from version "${version}". Use alphanumeric characters, dots, or hyphens (e.g. 1.0.0).`);
  }

  return `v${normalized.toLowerCase()}`;
}

/**
 * Compute the public URL path for a changelog post.
 * Format: /changelogs/{slug}
 */
export function computeChangelogUrl(post: { slug: string }): string {
  return `${Routes.changelogs}/${post.slug}`;
}
