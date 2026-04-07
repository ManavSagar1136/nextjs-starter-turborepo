/**
 * @buildbase/database - Delete Blog Folder (soft delete)
 */

import type { PrismaClient } from "@prisma/client";

export async function deleteBlogFolder(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.blogFolder.update({
    where: { id },
    data: { deleted: true },
  });
}
