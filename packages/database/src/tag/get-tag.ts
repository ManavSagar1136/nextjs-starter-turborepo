/**
 * @buildbase/database - Get Tag
 */

import { prisma } from "../index";
import type { TagWithDetails } from "./types";

/**
 * Find tag by ID with usage count
 */
export async function getTagById(id: string, workspaceId?: string): Promise<TagWithDetails | null> {
  const where: Record<string, unknown> = { id };
  if (workspaceId !== undefined) {
    where.workspaceId = workspaceId;
  }

  const tag = await prisma.mediaTag.findFirst({
    where,
    include: {
      _count: {
        select: { assetTags: true },
      },
    },
  });

  if (!tag) {
    return null;
  }

  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    count: tag._count.assetTags,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}
