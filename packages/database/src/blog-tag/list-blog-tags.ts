/**
 * @buildbase/database - List Blog Tags
 */

import type { PrismaClient } from "@prisma/client";
import type { ListBlogTagsOptions, PaginatedBlogTags } from "./types";

export async function listBlogTags(
  prisma: PrismaClient,
  options: ListBlogTagsOptions = {}
): Promise<PaginatedBlogTags> {
  const { isPublic, search, page = 1, limit = 20 } = options;

  const where: Record<string, unknown> = { deleted: false };

  if (isPublic !== undefined) {
    where.isPublic = isPublic;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.blogTag.findMany({
      where,
      orderBy: { title: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogTag.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
