/**
 * @buildbase/database - Delete Tag
 */

import { prisma } from "../index";

/**
 * Delete a tag by ID
 */
export async function deleteTag(id: string, workspaceId?: string): Promise<void> {
  // Verify tag exists
  const where: Record<string, unknown> = { id };
  if (workspaceId !== undefined) {
    where.workspaceId = workspaceId;
  }

  const tag = await prisma.mediaTag.findFirst({
    where,
  });

  if (!tag) {
    throw new Error("Tag not found");
  }

  // Delete tag (cascade will delete assetTags)
  await prisma.mediaTag.delete({ where: { id } });
}
