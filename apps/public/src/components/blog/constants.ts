/**
 * Represents the available view modes for displaying blog posts.
 * - GRID: Shows blog posts in a grid layout.
 * - LIST: Shows blog posts in a list (vertical) layout.
 */
export const BLOG_VIEW_MODE = {
  GRID: "grid",
  LIST: "list",
} as const;

/**
 * Type representing one of the valid blog view mode values ("grid" | "list").
 */
export type IBlogViewMode =
  (typeof BLOG_VIEW_MODE)[keyof typeof BLOG_VIEW_MODE];
