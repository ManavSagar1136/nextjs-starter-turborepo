/**
 * @buildbase/database - List Changelog Posts
 */

import type { PrismaClient } from "@prisma/client";
import type { ListChangelogPostsOptions, PaginatedChangelogPosts } from "./types";

export async function listChangelogPosts(
  prisma: PrismaClient,
  options: ListChangelogPostsOptions = {}
): Promise<PaginatedChangelogPosts> {
  const { published, search, includeDeleted = false, page = 1, limit = 20 } = options;

  const where: Record<string, unknown> = {};

  if (!includeDeleted) where.deleted = false;
  if (published !== undefined) where.published = published;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { version: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.changelogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.changelogPost.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
