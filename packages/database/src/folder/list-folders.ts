/**
 * @buildbase/database - List Folders
 */

import { prisma } from "../index";
import type { ListFoldersOptions, PaginatedFolders } from "./types";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./constants";

/**
 * List folders with pagination and filters
 */
export async function listFolders(options: ListFoldersOptions): Promise<PaginatedFolders> {
  const { workspaceId, parentFolderId, search, page = 1, limit = DEFAULT_PAGE_SIZE } = options;

  const finalLimit = Math.min(limit, MAX_PAGE_SIZE);
  const skip = (page - 1) * finalLimit;

  // Build where clause - workspaceId is optional for admin context
  // undefined = list all, null = list only admin folders (workspaceId IS NULL), string = list specific workspace
  const where: Record<string, unknown> = {};
  if (workspaceId !== undefined) {
    where.workspaceId = workspaceId === null ? null : workspaceId;
  }

  if (parentFolderId !== undefined) {
    where.parentFolderId = parentFolderId === null ? null : parentFolderId;
  }

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Query folders
  const [folders, totalDocs] = await Promise.all([
    prisma.assetFolder.findMany({
      where,
      include: {
        _count: {
          select: {
            assets: true,
            children: true,
          },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: finalLimit,
    }),
    prisma.assetFolder.count({ where }),
  ]);

  const docs = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    description: folder.description,
    parentFolderId: folder.parentFolderId,
    parent: folder.parent,
    _count: folder._count,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  }));

  const totalPages = Math.ceil(totalDocs / finalLimit);

  return {
    docs,
    totalDocs,
    limit: finalLimit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
