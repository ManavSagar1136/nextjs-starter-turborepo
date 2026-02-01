/**
 * @buildbase/database - Delete Folder
 */

import { prisma } from "../index";

/**
 * Delete a folder by ID
 */
export async function deleteFolder(id: string, recursive: boolean = false): Promise<void> {
  // Verify folder exists
  const folder = await prisma.assetFolder.findUnique({
    where: { id },
    include: {
      _count: {
        select: { assets: true, children: true },
      },
    },
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  // Check for contents
  if (!recursive && (folder._count.assets > 0 || folder._count.children > 0)) {
    throw new Error(
      `Folder is not empty. Use recursive=true to delete with contents. (${folder._count.assets} assets, ${folder._count.children} subfolders)`
    );
  }

  // If recursive, move assets to root and delete subfolders
  if (recursive) {
    // Move all assets in this folder tree to root
    // Note: If folder.workspaceId is null (admin folder), we only filter by folderId
    // since Asset.workspaceId is required and won't match null
    const assetWhere: Record<string, unknown> = { folderId: id };
    if (folder.workspaceId !== null) {
      assetWhere.workspaceId = folder.workspaceId;
    }
    // If workspaceId is null, we don't add it to the where clause
    // This will match assets in this folder regardless of workspace
    await prisma.asset.updateMany({
      where: assetWhere,
      data: { folderId: null },
    });

    // Recursively delete child folders
    const deleteChildFolders = async (parentId: string) => {
      const children = await prisma.assetFolder.findMany({
        where: { parentFolderId: parentId },
      });

      for (const child of children) {
        // Move child's assets to root
        await prisma.asset.updateMany({
          where: { folderId: child.id },
          data: { folderId: null },
        });
        // Recurse
        await deleteChildFolders(child.id);
        // Delete child folder
        await prisma.assetFolder.delete({ where: { id: child.id } });
      }
    };

    await deleteChildFolders(id);
  }

  // Delete the folder
  await prisma.assetFolder.delete({ where: { id } });
}
