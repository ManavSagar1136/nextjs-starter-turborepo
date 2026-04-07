/**
 * @buildbase/database - List Doc Posts
 */

import type { PrismaClient } from "@prisma/client";
import type { ListDocPostsOptions, PaginatedDocPosts } from "./types";

export async function listDocPosts(
  prisma: PrismaClient,
  options: ListDocPostsOptions = {}
): Promise<PaginatedDocPosts> {
  const { published, folderId, search, page = 1, limit = 20 } = options;

  const where: Record<string, unknown> = { deleted: false };

  if (published !== undefined) where.published = published;
  if (folderId) where.folderId = folderId;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.docPost.findMany({
      where,
      include: { folder: true },
      orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.docPost.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
