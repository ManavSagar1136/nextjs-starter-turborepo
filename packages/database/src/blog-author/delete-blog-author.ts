/**
 * @buildbase/database - Delete Blog Author (soft delete)
 */

import type { PrismaClient } from "@prisma/client";

export async function deleteBlogAuthor(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.blogAuthor.update({
    where: { id },
    data: { deleted: true },
  });
}
