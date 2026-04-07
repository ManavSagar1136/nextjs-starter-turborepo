/**
 * @buildbase/database - List Blog Authors
 */

import type { PrismaClient } from "@prisma/client";
import type { ListBlogAuthorsOptions, PaginatedBlogAuthors } from "./types";

export async function listBlogAuthors(
  prisma: PrismaClient,
  options: ListBlogAuthorsOptions = {}
): Promise<PaginatedBlogAuthors> {
  const { search, page = 1, limit = 20 } = options;

  const where: Record<string, unknown> = { deleted: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.blogAuthor.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogAuthor.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
