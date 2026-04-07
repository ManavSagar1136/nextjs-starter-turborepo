/**
 * @buildbase/database - Delete Blog Tag (soft delete)
 */

import type { PrismaClient } from "@prisma/client";

export async function deleteBlogTag(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.blogTag.update({
    where: { id },
    data: { deleted: true },
  });
}
