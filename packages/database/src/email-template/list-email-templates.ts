/**
 * @buildbase/database - List Email Templates
 */

import type { PrismaClient, EmailTemplate } from "../generated/client";
import type { ListEmailTemplatesOptions, PaginatedEmailTemplates, EmailTemplateCategory } from "./types";
import { DEFAULT_PAGE_SIZE } from "./constants";

/**
 * List email templates with pagination and filters
 */
export async function listEmailTemplates(
  prisma: PrismaClient,
  options: ListEmailTemplatesOptions = {}
): Promise<PaginatedEmailTemplates> {
  const { workspaceId, category, isActive, search, page = 1, limit = DEFAULT_PAGE_SIZE } = options;

  const where: Record<string, unknown> = {};

  // Only filter by workspaceId if explicitly provided
  // If undefined, don't filter (show all templates regardless of workspaceId)
  if (workspaceId !== undefined) {
    where.workspaceId = workspaceId ?? null;
  }

  if (category) {
    where.category = category;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.emailTemplate.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.emailTemplate.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * List email templates by category
 */
export async function listEmailTemplatesByCategory(
  prisma: PrismaClient,
  category: EmailTemplateCategory,
  workspaceId?: string
): Promise<EmailTemplate[]> {
  return prisma.emailTemplate.findMany({
    where: {
      category,
      workspaceId: workspaceId ?? null,
      isActive: true,
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}
