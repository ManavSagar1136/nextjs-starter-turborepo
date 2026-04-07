/**
 * Dialog Keys Constants
 *
 * This file contains all dialog keys for the admin app.
 * Use these constants instead of hardcoding strings to ensure type safety
 * and avoid typos. All dialog keys should be defined here.
 *
 * Naming convention: Use the format "app:feature" (e.g., "admin:create-user")
 */

/**
 * Admin app dialog keys.
 * Add new dialog keys here as you create new dialogs.
 */
export const ADMIN_DIALOG_KEYS = {
  // Blog Posts
  CREATE_BLOG_POST: "admin:create-blog-post",
  EDIT_BLOG_POST: "admin:edit-blog-post",
  // Blog Folders
  CREATE_BLOG_FOLDER: "admin:create-blog-folder",
  EDIT_BLOG_FOLDER: "admin:edit-blog-folder",
  // Blog Tags
  CREATE_BLOG_TAG: "admin:create-blog-tag",
  EDIT_BLOG_TAG: "admin:edit-blog-tag",
  // Blog Authors
  CREATE_BLOG_AUTHOR: "admin:create-blog-author",
  EDIT_BLOG_AUTHOR: "admin:edit-blog-author",
  // Doc Posts
  CREATE_DOC_POST: "admin:create-doc-post",
  EDIT_DOC_POST: "admin:edit-doc-post",
  // Doc Folders
  CREATE_DOC_FOLDER: "admin:create-doc-folder",
  EDIT_DOC_FOLDER: "admin:edit-doc-folder",
} as const;

/**
 * Type representing all admin app dialog keys.
 * This provides type safety when using dialog keys.
 */
export type AdminDialogKey = (typeof ADMIN_DIALOG_KEYS)[keyof typeof ADMIN_DIALOG_KEYS];

/**
 * Combined dialog keys (common + app-specific).
 * This includes both common dialogs and app-specific dialogs.
 */
import { COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";

export const ALL_DIALOG_KEYS = {
  ...COMMON_DIALOG_KEYS,
  ...ADMIN_DIALOG_KEYS,
} as const;

/**
 * Type representing all available dialog keys (common + app-specific).
 */
export type AllDialogKey = (typeof ALL_DIALOG_KEYS)[keyof typeof ALL_DIALOG_KEYS];
