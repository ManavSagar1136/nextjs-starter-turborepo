/**
 * @buildbase/database - Create Folder
 */

import { prisma } from "../index";
import type { AssetFolder } from "../generated/client";
import type { CreateFolderInput } from "./types";
import { validateFolderName, validateFolderNameUniqueness } from "../assets/validation.utils";

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderInput): Promise<AssetFolder> {
  // Validate folder name format (length and characters)
  validateFolderName(data.name);

  let finalWorkspaceId: string | null | undefined = data.workspaceId;
  const finalParentFolderId = data.parentFolderId || null;

  // Verify parent folder exists if provided
  if (data.parentFolderId) {
    const where: Record<string, unknown> = { id: data.parentFolderId };
    if (finalWorkspaceId !== undefined) {
      where.workspaceId = finalWorkspaceId === null ? null : finalWorkspaceId;
    }
    const parentFolder = await prisma.assetFolder.findFirst({ where });
    if (!parentFolder) {
      throw new Error("Parent folder not found");
    }
    // If workspaceId not provided, use parent's workspaceId (can be null)
    if (finalWorkspaceId === undefined) {
      finalWorkspaceId = parentFolder.workspaceId;
    }
  }

  // If workspaceId not provided (admin context), set to null
  // This allows admin to create global folders without workspace association
  if (finalWorkspaceId === undefined) {
    finalWorkspaceId = null;
  }

  // Check name uniqueness within parent folder and workspace
  await validateFolderNameUniqueness(data.name.trim(), finalParentFolderId, finalWorkspaceId);

  const createData: {
    name: string;
    description: string | null;
    parentFolderId: string | null;
    workspaceId: string | null;
    userId: string;
  } = {
    name: data.name.trim(),
    description: data.description || null,
    parentFolderId: finalParentFolderId,
    workspaceId: finalWorkspaceId,
    userId: data.userId,
  };

  return prisma.assetFolder.create({
    data: createData as any,
  });
}
