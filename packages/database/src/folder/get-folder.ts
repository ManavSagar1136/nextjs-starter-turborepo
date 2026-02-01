/**
 * @buildbase/database - Get Folder
 */

import { prisma } from "../index";
import type { FolderWithDetails } from "./types";

/**
 * Find folder by ID with full details
 */
export async function getFolderById(id: string): Promise<FolderWithDetails | null> {
  const folder = await prisma.assetFolder.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          assets: true,
          children: true,
        },
      },
      parent: {
        select: { id: true, name: true },
      },
    },
  });

  if (!folder) {
    return null;
  }

  // Build folder path
  const path: Array<{ id: string; name: string }> = [];
  let currentFolderId: string | null = folder.id;
  const visited = new Set<string>();

  while (currentFolderId && !visited.has(currentFolderId)) {
    visited.add(currentFolderId);
    const currentFolderData: { id: string; name: string; parentFolderId: string | null } | null =
      await prisma.assetFolder.findUnique({
        where: { id: currentFolderId },
        select: { id: true, name: true, parentFolderId: true },
      });

    if (!currentFolderData) break;

    path.unshift({ id: currentFolderData.id, name: currentFolderData.name });
    currentFolderId = currentFolderData.parentFolderId;
  }

  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    parentFolderId: folder.parentFolderId,
    parent: folder.parent,
    path,
    _count: folder._count,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}
