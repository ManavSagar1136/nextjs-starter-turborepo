/**
 * @buildbase/database - Validation Utilities
 * Shared validation functions for folders, tags, and assets
 */

import { prisma } from "../index";
import { MIN_FOLDER_NAME_LENGTH, MAX_FOLDER_NAME_LENGTH, FOLDER_NAME_PATTERN } from "../folder/constants";
import { MIN_TAG_NAME_LENGTH, MAX_TAG_NAME_LENGTH, TAG_NAME_PATTERN } from "../tag/constants";

/**
 * Validate folder name format (length and characters)
 * @throws Error if validation fails
 */
export function validateFolderName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new Error("Folder name is required");
  }

  const trimmedName = name.trim();

  if (trimmedName.length < MIN_FOLDER_NAME_LENGTH) {
    throw new Error(
      `Folder name must be at least ${MIN_FOLDER_NAME_LENGTH} character${MIN_FOLDER_NAME_LENGTH === 1 ? "" : "s"}`
    );
  }

  if (trimmedName.length > MAX_FOLDER_NAME_LENGTH) {
    throw new Error(`Folder name must be no more than ${MAX_FOLDER_NAME_LENGTH} characters`);
  }

  if (!FOLDER_NAME_PATTERN.test(trimmedName)) {
    throw new Error("Folder name can only contain letters, numbers, spaces, hyphens, and underscores");
  }
}

/**
 * Validate tag name format (length and characters)
 * @throws Error if validation fails
 */
export function validateTagName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new Error("Tag name is required");
  }

  const trimmedName = name.trim();

  if (trimmedName.length < MIN_TAG_NAME_LENGTH) {
    throw new Error(
      `Tag name must be at least ${MIN_TAG_NAME_LENGTH} character${MIN_TAG_NAME_LENGTH === 1 ? "" : "s"}`
    );
  }

  if (trimmedName.length > MAX_TAG_NAME_LENGTH) {
    throw new Error(`Tag name must be no more than ${MAX_TAG_NAME_LENGTH} characters`);
  }

  if (!TAG_NAME_PATTERN.test(trimmedName)) {
    throw new Error("Tag name can only contain letters, numbers, spaces, hyphens, and underscores");
  }
}

/**
 * Check if a folder name is unique within a parent folder and workspace
 * @param name - The folder name to check
 * @param parentFolderId - The parent folder ID (null for root)
 * @param workspaceId - The workspace ID (null for admin folders)
 * @param excludeId - Optional folder ID to exclude from check (for updates)
 * @throws Error if name is not unique
 */
export async function validateFolderNameUniqueness(
  name: string,
  parentFolderId: string | null,
  workspaceId: string | null,
  excludeId?: string
): Promise<void> {
  const where: Record<string, unknown> = {
    name: name.trim(),
    parentFolderId: parentFolderId ?? null,
    workspaceId: workspaceId ?? null,
  };

  if (excludeId) {
    where.NOT = { id: excludeId };
  }

  const existing = await prisma.assetFolder.findFirst({ where });

  if (existing) {
    throw new Error("A folder with this name already exists in this location");
  }
}

/**
 * Check if a tag slug is unique within a workspace
 * Note: Tag uniqueness is based on slug, not name, since slugs are auto-generated
 * This function is provided for consistency but tag slug uniqueness is already handled in create-tag.ts and update-tag.ts
 * @param slug - The tag slug to check
 * @param workspaceId - The workspace ID (null for admin tags)
 * @param excludeId - Optional tag ID to exclude from check (for updates)
 * @throws Error if slug is not unique
 */
export async function validateTagSlugUniqueness(
  slug: string,
  workspaceId: string | null,
  excludeId?: string
): Promise<void> {
  const where: Record<string, unknown> = {
    slug,
    workspaceId: workspaceId ?? null,
  };

  if (excludeId) {
    where.NOT = { id: excludeId };
  }

  const existing = await prisma.mediaTag.findFirst({ where });

  if (existing) {
    throw new Error("A tag with this slug already exists in this workspace");
  }
}
