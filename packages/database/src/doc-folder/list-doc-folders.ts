/**
 * @buildbase/database - List Doc Folders
 */

import type { PrismaClient } from "@prisma/client";
import type { ListDocFoldersOptions, PaginatedDocFolders } from "./types";

export async function listDocFolders(
  prisma: PrismaClient,
  options: ListDocFoldersOptions = {}
): Promise<PaginatedDocFolders> {
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
    prisma.docFolder.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.docFolder.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
