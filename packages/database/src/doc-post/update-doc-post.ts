/**
 * @buildbase/database - Update Doc Post
 */

import type { PrismaClient } from "@prisma/client";
import type { UpdateDocPostInput } from "./types";

export async function updateDocPost(prisma: PrismaClient, id: string, data: UpdateDocPostInput, updatedById?: string) {
  const existing = await prisma.docPost.findUnique({ where: { id } });
  if (!existing) throw new Error(`Doc post with id "${id}" not found`);

  let publishedAt = existing.publishedAt;
  if (data.published === true && !existing.publishedAt) {
    publishedAt = new Date();
  }

  return prisma.docPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
      ...(data.seoKeywords !== undefined && { seoKeywords: data.seoKeywords }),
      ...(data.folderId !== undefined && { folderId: data.folderId }),
      publishedAt,
      updatedById: updatedById ?? null,
    },
    include: { folder: true },
  });
}
