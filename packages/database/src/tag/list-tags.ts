/**
 * @buildbase/database - List Tags
 */

import { prisma } from "../index";
import type { ListTagsOptions, PaginatedTags } from "./types";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./constants";

/**
 * List tags with pagination and filters
 */
export async function listTags(options: ListTagsOptions): Promise<PaginatedTags> {
  const { workspaceId, search, page = 1, limit = DEFAULT_PAGE_SIZE } = options;

  const finalLimit = Math.min(limit, MAX_PAGE_SIZE);
  const skip = (page - 1) * finalLimit;

  // Build where clause - workspaceId is optional for admin context
  // undefined = list all, null = list only admin tags (workspaceId IS NULL), string = list specific workspace
  const where: Record<string, unknown> = {};
  if (workspaceId !== undefined) {
    where.workspaceId = workspaceId === null ? null : workspaceId;
  }
  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  // Query tags with usage count
  const [tags, totalDocs] = await Promise.all([
    prisma.mediaTag.findMany({
      where,
      include: {
        _count: {
          select: { assetTags: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: finalLimit,
    }),
    prisma.mediaTag.count({ where }),
  ]);

  const docs = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    count: tag._count.assetTags,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  }));

  const totalPages = Math.ceil(totalDocs / finalLimit);

  return {
    docs,
    total: totalDocs,
    totalDocs,
    limit: finalLimit,
    page,
    totalPages,
  };
}
