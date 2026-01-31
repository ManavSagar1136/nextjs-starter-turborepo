/**
 * @buildbase/database - Delete Email Provider
 */

import type { PrismaClient } from "../generated/client";

/**
 * Delete an email provider by ID
 */
export async function deleteEmailProvider(prisma: PrismaClient, id: string): Promise<void> {
  const existing = await prisma.emailProvider.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Email provider not found: ${id}`);
  }

  await prisma.emailProvider.delete({ where: { id } });
}
