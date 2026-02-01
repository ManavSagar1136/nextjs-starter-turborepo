/**
 * @buildbase/database - Verify Folder Ownership
 */

import { prisma } from "../index";

/**
 * Verify that a folder exists and belongs to the specified workspace
 * @returns true if folder exists and belongs to workspace, false otherwise
 */
export async function verifyFolderOwnership(folderId: string, workspaceId: string): Promise<boolean> {
  const folder = await prisma.assetFolder.findFirst({
    where: { id: folderId, workspaceId },
    select: { id: true },
  });

  return folder !== null;
}
