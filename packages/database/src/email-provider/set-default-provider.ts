/**
 * @buildbase/database - Set Default Email Provider
 */

import type { PrismaClient, EmailProvider } from "../generated/client";

/**
 * Set a provider as the default for its workspace
 */
export async function setDefaultEmailProvider(prisma: PrismaClient, id: string): Promise<EmailProvider> {
  const provider = await prisma.emailProvider.findUnique({ where: { id } });
  if (!provider) {
    throw new Error(`Email provider not found: ${id}`);
  }

  // Clear other defaults
  await prisma.emailProvider.updateMany({
    where: {
      workspaceId: provider.workspaceId,
      isDefault: true,
    },
    data: { isDefault: false },
  });

  // Set this one as default
  return prisma.emailProvider.update({
    where: { id },
    data: { isDefault: true },
  });
}
