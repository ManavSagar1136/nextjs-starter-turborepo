/**
 * @buildbase/database - Delete Blog Post (soft delete)
 */

import type { PrismaClient } from "@prisma/client";

export async function deleteBlogPost(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.blogPost.update({
    where: { id },
    data: { deleted: true },
  });
}
