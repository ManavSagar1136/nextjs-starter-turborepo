/**
 * @buildbase/database - Update Email Template
 */

import type { PrismaClient, EmailTemplate } from "../generated/client";
import type { UpdateEmailTemplateInput } from "./types";

/**
 * Update an existing email template
 */
export async function updateEmailTemplate(
  prisma: PrismaClient,
  id: string,
  data: UpdateEmailTemplateInput,
  userId?: string
): Promise<EmailTemplate> {
  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Email template not found: ${id}`);
  }

  return prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.subject && { subject: data.subject }),
      ...(data.html && { html: data.html }),
      ...(data.text !== undefined && { text: data.text }),
      ...(data.design !== undefined && { design: data.design }),
      ...(data.category && { category: data.category }),
      ...(data.tags && { tags: data.tags }),
      ...(data.variables && { variables: JSON.stringify(data.variables) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      version: { increment: 1 },
      updatedById: userId,
    },
  });
}
