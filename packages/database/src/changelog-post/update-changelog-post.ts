/**
 * @buildbase/database - Update Changelog Post
 */

import type { PrismaClient } from "@prisma/client";
import type { UpdateChangelogPostInput } from "./types";

export async function updateChangelogPost(prisma: PrismaClient, id: string, data: UpdateChangelogPostInput) {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.version !== undefined) updateData.version = data.version;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.published !== undefined) updateData.published = data.published;
  if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt;
  if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate;
  if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
  if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;
  if (data.seoKeywords !== undefined) updateData.seoKeywords = data.seoKeywords;
  if (data.updatedById !== undefined) updateData.updatedById = data.updatedById;

  return prisma.changelogPost.update({ where: { id }, data: updateData });
}
