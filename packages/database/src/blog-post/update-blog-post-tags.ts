/**
 * @buildbase/database - Update Blog Post Tags (replace all)
 */

import type { PrismaClient } from "@prisma/client";

export async function updateBlogPostTags(prisma: PrismaClient, postId: string, tagIds: string[]): Promise<void> {
  await prisma.blogPostTag.deleteMany({ where: { postId } });

  if (tagIds.length > 0) {
    await prisma.blogPostTag.createMany({
      data: tagIds.map(tagId => ({ postId, tagId })),
    });
  }
}
