/**
 * @buildbase/database - Duplicate Email Template
 */

import type { PrismaClient, EmailTemplate } from "../generated/client";

/**
 * Duplicate an existing email template with a new slug
 */
export async function duplicateEmailTemplate(
  prisma: PrismaClient,
  id: string,
  newSlug: string,
  userId?: string
): Promise<EmailTemplate> {
  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Email template not found: ${id}`);
  }

  // Check if new slug already exists
  const slugExists = await prisma.emailTemplate.findUnique({ where: { slug: newSlug } });
  if (slugExists) {
    throw new Error(`Template with slug "${newSlug}" already exists`);
  }

  return prisma.emailTemplate.create({
    data: {
      slug: newSlug,
      name: `${existing.name} (Copy)`,
      description: existing.description,
      subject: existing.subject,
      html: existing.html,
      text: existing.text,
      design: existing.design,
      category: existing.category,
      tags: existing.tags,
      variables: existing.variables,
      workspaceId: existing.workspaceId,
      createdById: userId,
      version: 1,
    },
  });
}
