/**
 * @buildbase/database - Delete Tag
 */

import { prisma } from "../index";

/**
 * Delete a tag by ID
 */
export async function deleteTag(id: string): Promise<void> {
  // Verify tag exists
  const tag = await prisma.mediaTag.findUnique({
    where: { id },
  });

  if (!tag) {
    throw new Error("Tag not found");
  }

  // Delete tag (cascade will delete assetTags)
  await prisma.mediaTag.delete({ where: { id } });
}
