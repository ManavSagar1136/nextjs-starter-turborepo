/**
 * @buildbase/database - Delete Doc Post (soft delete)
 */

import type { PrismaClient } from "@prisma/client";

export async function deleteDocPost(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.docPost.update({
    where: { id },
    data: { deleted: true },
  });
}
