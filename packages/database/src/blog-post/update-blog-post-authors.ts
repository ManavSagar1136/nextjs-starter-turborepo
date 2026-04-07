/**
 * @buildbase/database - Update Blog Post Authors (replace all)
 */

import type { PrismaClient } from "@prisma/client";

export async function updateBlogPostAuthors(prisma: PrismaClient, postId: string, authorIds: string[]): Promise<void> {
  await prisma.blogPostAuthor.deleteMany({ where: { postId } });

  if (authorIds.length > 0) {
    await prisma.blogPostAuthor.createMany({
      data: authorIds.map(authorId => ({ postId, authorId })),
    });
  }
}
