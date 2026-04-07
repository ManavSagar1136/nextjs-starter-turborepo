/**
 * @buildbase/database - Delete Doc Folder (soft delete)
 */

import type { PrismaClient } from "@prisma/client";

export async function deleteDocFolder(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.docFolder.update({
    where: { id },
    data: { deleted: true },
  });
}
