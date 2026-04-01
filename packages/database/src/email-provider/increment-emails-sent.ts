/**
 * @buildbase/database - Increment Emails Sent Counter
 */

import type { PrismaClient } from "@prisma/client";

/**
 * Increment the emails sent counter and update last used timestamp
 */
export async function incrementEmailsSent(prisma: PrismaClient, id: string): Promise<void> {
  await prisma.emailProvider.update({
    where: { id },
    data: {
      emailsSent: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}
