/**
 * @buildbase/database - Delete Email Template
 */

import type { PrismaClient } from "@prisma/client";

/**
 * Delete an email template by ID
 */
export async function deleteEmailTemplate(prisma: PrismaClient, id: string): Promise<void> {
  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Email template not found: ${id}`);
  }

  await prisma.emailTemplate.delete({ where: { id } });
}
