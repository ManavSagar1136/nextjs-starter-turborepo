/**
 * @buildbase/database - Get Folder Tree
 */

import { prisma } from "../index";
import type { FolderTreeItem } from "./types";

/**
 * Get folder tree structure (all folders if workspaceId not provided, or for a specific workspace)
 */
export async function getFolderTree(workspaceId?: string | null): Promise<FolderTreeItem[]> {
  // Get all folders (optionally filtered by workspace)
  // undefined = all folders, null = only admin folders, string = specific workspace
  const where: Record<string, unknown> = {};
  if (workspaceId !== undefined) {
    where.workspaceId = workspaceId === null ? null : workspaceId;
  }
  const folders = await prisma.assetFolder.findMany({
    where,
    include: {
      _count: {
        select: {
          assets: true,
          children: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Build tree structure
  const folderMap = new Map<string, FolderTreeItem>();
  const rootFolders: FolderTreeItem[] = [];

  // First pass: create all folder items
  for (const folder of folders) {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      children: [],
      _count: folder._count,
    });
  }

  // Second pass: build hierarchy
  for (const folder of folders) {
    const item = folderMap.get(folder.id)!;
    if (folder.parentFolderId) {
      const parent = folderMap.get(folder.parentFolderId);
      if (parent) {
        parent.children.push(item);
      } else {
        // Parent not found, treat as root
        rootFolders.push(item);
      }
    } else {
      rootFolders.push(item);
    }
  }

  return rootFolders;
}
