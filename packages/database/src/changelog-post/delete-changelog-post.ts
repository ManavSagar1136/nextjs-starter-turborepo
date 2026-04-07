/**
 * @buildbase/database - Delete Changelog Post (soft delete)
 */

import type { PrismaClient } from "@prisma/client";

export async function deleteChangelogPost(prisma: PrismaClient, id: string, updatedById?: string) {
  return prisma.changelogPost.update({
    where: { id },
    data: {
      deleted: true,
      ...(updatedById && { updatedById }),
    },
  });
}
