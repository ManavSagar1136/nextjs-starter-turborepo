/**
 * @buildbase/database - Get Email Template
 */

import type { PrismaClient, EmailTemplate } from "@prisma/client";

/**
 * Find email template by ID
 */
export async function getEmailTemplateById(prisma: PrismaClient, id: string): Promise<EmailTemplate | null> {
  return prisma.emailTemplate.findUnique({ where: { id } });
}

/**
 * Find email template by slug
 */
export async function getEmailTemplateBySlug(prisma: PrismaClient, slug: string): Promise<EmailTemplate | null> {
  return prisma.emailTemplate.findUnique({ where: { slug } });
}
