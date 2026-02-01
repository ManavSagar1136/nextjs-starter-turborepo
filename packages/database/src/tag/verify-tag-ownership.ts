/**
 * @buildbase/database - Verify Tag Ownership
 */

import { prisma } from "../index";

/**
 * Verify that a tag exists and belongs to the specified workspace
 * @returns true if tag exists and belongs to workspace, false otherwise
 */
export async function verifyTagOwnership(tagId: string, workspaceId: string): Promise<boolean> {
  const tag = await prisma.mediaTag.findFirst({
    where: { id: tagId, workspaceId },
    select: { id: true },
  });

  return tag !== null;
}
