/**
 * @buildbase/database - Update Folder
 */

import { prisma } from "../index";
import type { AssetFolder } from "../generated/client";
import type { UpdateFolderInput } from "./types";
import { MAX_FOLDER_DEPTH } from "./constants";
import { validateFolderName, validateFolderNameUniqueness } from "../assets/validation.utils";

/**
 * Calculate the depth of a folder from root
 * @param folderId - The folder ID to calculate depth for (null for root = 0)
 * @returns The depth of the folder (0 for root, 1 for first level, etc.)
 */
async function calculateFolderDepth(folderId: string | null): Promise<number> {
  if (!folderId) return 0;

  let depth = 0;
  let currentId: string | null = folderId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const folder: { parentFolderId: string | null } | null = await prisma.assetFolder.findUnique({
      where: { id: currentId },
      select: { parentFolderId: true },
    });
    if (!folder) break;
    depth++;
    currentId = folder.parentFolderId;
  }

  return depth;
}

/**
 * Update an existing folder
 */
export async function updateFolder(id: string, data: UpdateFolderInput): Promise<AssetFolder> {
  // Verify folder exists
  const existingFolder = await prisma.assetFolder.findUnique({
    where: { id },
  });

  if (!existingFolder) {
    throw new Error("Folder not found");
  }

  // Validate folder name if provided
  if (data.name !== undefined) {
    validateFolderName(data.name);
  }

  // Determine the final parent folder ID (for uniqueness check)
  const finalParentFolderId = data.parentFolderId !== undefined ? data.parentFolderId : existingFolder.parentFolderId;

  // Check name uniqueness if name is being changed or parent is being changed
  if (
    data.name !== undefined ||
    (data.parentFolderId !== undefined && data.parentFolderId !== existingFolder.parentFolderId)
  ) {
    const nameToCheck = data.name !== undefined ? data.name.trim() : existingFolder.name;
    await validateFolderNameUniqueness(nameToCheck, finalParentFolderId, existingFolder.workspaceId, id);
  }

  // Validate parent folder change
  if (data.parentFolderId !== undefined && data.parentFolderId !== existingFolder.parentFolderId) {
    // Can't move folder to itself
    if (data.parentFolderId === id) {
      throw new Error("Cannot move folder into itself");
    }

    // Verify new parent exists and is in the same workspace
    if (data.parentFolderId !== null) {
      const parentFolder = await prisma.assetFolder.findUnique({
        where: { id: data.parentFolderId },
      });
      if (!parentFolder) {
        throw new Error("Parent folder not found");
      }

      // Ensure parent is in the same workspace
      if (parentFolder.workspaceId !== existingFolder.workspaceId) {
        throw new Error("Parent folder must be in the same workspace");
      }

      // Check for circular reference
      let checkFolder = parentFolder;
      while (checkFolder.parentFolderId) {
        if (checkFolder.parentFolderId === id) {
          throw new Error("Cannot create circular folder reference");
        }
        const nextFolder = await prisma.assetFolder.findUnique({
          where: { id: checkFolder.parentFolderId },
        });
        if (!nextFolder) break;
        checkFolder = nextFolder;
      }

      // Check folder depth (max 10 levels)
      // Calculate depth of target parent
      const targetParentDepth = await calculateFolderDepth(data.parentFolderId);
      // When moving to a parent, the new depth is: targetParentDepth + 1
      const newDepth = targetParentDepth + 1;

      if (newDepth > MAX_FOLDER_DEPTH) {
        throw new Error(`Maximum folder depth (${MAX_FOLDER_DEPTH} levels) would be exceeded`);
      }
    } else {
      // Moving to root - new depth will be 1 (first level)
      // This is always valid (1 <= 10), so no check needed
    }
  }

  // Update folder
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.parentFolderId !== undefined) updateData.parentFolderId = data.parentFolderId;

  return prisma.assetFolder.update({
    where: { id },
    data: updateData,
  });
}
