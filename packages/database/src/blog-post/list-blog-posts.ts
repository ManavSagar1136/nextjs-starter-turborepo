/**
 * @buildbase/database - List Blog Posts
 */

import type { PrismaClient } from "@prisma/client";
import type { ListBlogPostsOptions, PaginatedBlogPosts } from "./types";

export async function listBlogPosts(
  prisma: PrismaClient,
  options: ListBlogPostsOptions = {}
): Promise<PaginatedBlogPosts> {
  const { published, featured, folderId, tagId, authorId, search, page = 1, limit = 20 } = options;

  const where: Record<string, unknown> = { deleted: false };

  if (published !== undefined) where.published = published;
  if (featured !== undefined) where.featured = featured;
  if (folderId) where.folderId = folderId;

  if (tagId) {
    where.tags = { some: { tagId } };
  }

  if (authorId) {
    where.authors = { some: { authorId } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        folder: true,
        authors: { include: { author: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
