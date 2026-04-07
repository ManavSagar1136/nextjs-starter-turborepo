/**
 * @buildbase/database - Get Doc Folder Tree
 */

import type { PrismaClient } from "@prisma/client";
import type { DocFolderTreeItem } from "./types";

export async function getDocFolderTree(prisma: PrismaClient): Promise<DocFolderTreeItem[]> {
  const folders = await prisma.docFolder.findMany({
    where: { deleted: false },
    orderBy: { name: "asc" },
  });

  const folderMap = new Map<string, DocFolderTreeItem>();
  const rootFolders: DocFolderTreeItem[] = [];

  for (const folder of folders) {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      path: folder.path,
      parentFolderId: folder.parentFolderId,
      children: [],
    });
  }

  for (const folder of folders) {
    const item = folderMap.get(folder.id)!;
    if (folder.parentFolderId) {
      const parent = folderMap.get(folder.parentFolderId);
      if (parent) {
        parent.children.push(item);
      } else {
        rootFolders.push(item);
      }
    } else {
      rootFolders.push(item);
    }
  }

  return rootFolders;
}
