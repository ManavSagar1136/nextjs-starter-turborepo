/**
 * @buildbase/database - Update Folder
 */

import { prisma } from "../index";
import type { AssetFolder } from "../generated/client";
import type { UpdateFolderInput } from "./types";

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
    }
  }

  // Update folder
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.parentFolderId !== undefined) updateData.parentFolderId = data.parentFolderId;

  return prisma.assetFolder.update({
    where: { id },
    data: updateData,
  });
}
