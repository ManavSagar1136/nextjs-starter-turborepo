/**
 * @buildbase/database - Get Tag
 */

import { prisma } from "../index";
import type { TagWithDetails } from "./types";

/**
 * Find tag by ID with usage count
 */
export async function getTagById(id: string): Promise<TagWithDetails | null> {
  const tag = await prisma.mediaTag.findUnique({
    where: { id },
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
