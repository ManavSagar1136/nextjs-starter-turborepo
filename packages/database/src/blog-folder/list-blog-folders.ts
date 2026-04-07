/**
 * @buildbase/database - List Blog Folders
 */

import type { PrismaClient } from "@prisma/client";
import type { ListBlogFoldersOptions, PaginatedBlogFolders } from "./types";

export async function listBlogFolders(
  prisma: PrismaClient,
  options: ListBlogFoldersOptions = {}
): Promise<PaginatedBlogFolders> {
  const { parentFolderId, search, page = 1, limit = 20 } = options;

  const where: Record<string, unknown> = { deleted: false };

  if (parentFolderId !== undefined) {
    where.parentFolderId = parentFolderId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.blogFolder.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogFolder.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
