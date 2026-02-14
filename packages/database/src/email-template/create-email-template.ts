/**
 * @buildbase/database - Create Email Template
 */

import type { PrismaClient, EmailTemplate } from "@prisma/client";
import type { CreateEmailTemplateInput, TemplateVariable } from "./types";

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  prisma: PrismaClient,
  data: CreateEmailTemplateInput,
  userId?: string
): Promise<EmailTemplate> {
  const slug = data.slug || generateSlug(data.name);

  // Check if slug already exists
  const existing = await prisma.emailTemplate.findUnique({ where: { slug } });
  if (existing) {
    throw new Error(`Template with slug "${slug}" already exists`);
  }

  return prisma.emailTemplate.create({
    data: {
      slug,
      name: data.name,
      description: data.description,
      subject: data.subject,
      html: data.html,
      text: data.text,
      design: data.design,
      category: data.category ?? "TRANSACTIONAL",
      tags: data.tags ?? [],
      variables: JSON.stringify(data.variables ?? []),
      workspaceId: data.workspaceId,
      createdById: userId,
    },
  });
}
