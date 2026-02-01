/**
 * @buildbase/database - Create Folder
 */

import { prisma } from "../index";
import type { AssetFolder } from "../generated/client";
import type { CreateFolderInput } from "./types";

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderInput): Promise<AssetFolder> {
  let finalWorkspaceId: string | null | undefined = data.workspaceId;

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

  const createData: {
    name: string;
    description: string | null;
    parentFolderId: string | null;
    workspaceId: string | null;
    userId: string;
  } = {
    name: data.name,
    description: data.description || null,
    parentFolderId: data.parentFolderId || null,
    workspaceId: finalWorkspaceId,
    userId: data.userId,
  };

  return prisma.assetFolder.create({
    data: createData as any,
  });
}
