/**
 * @buildbase/database - Update Blog Post
 */

import type { PrismaClient } from "@prisma/client";
import type { UpdateBlogPostInput } from "./types";

export async function updateBlogPost(
  prisma: PrismaClient,
  id: string,
  data: UpdateBlogPostInput,
  updatedById?: string
) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new Error(`Blog post with id "${id}" not found`);

  // Set publishedAt on first publish; keep it when unpublishing
  let publishedAt = existing.publishedAt;
  if (data.published === true && !existing.publishedAt) {
    publishedAt = new Date();
  }

  // Set featuredAt when featuring
  let featuredAt = existing.featuredAt;
  if (data.featured === true && !existing.featuredAt) {
    featuredAt = new Date();
  } else if (data.featured === false) {
    featuredAt = null;
  }

  return prisma.blogPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.imageTitle !== undefined && { imageTitle: data.imageTitle }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.seoTitle !== undefined && { seoTitle: data.seoTitle }),
      ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
      ...(data.seoKeywords !== undefined && { seoKeywords: data.seoKeywords }),
      ...(data.folderId !== undefined && { folderId: data.folderId }),
      publishedAt,
      featuredAt,
      updatedById: updatedById ?? null,
    },
    include: {
      folder: true,
      authors: { include: { author: true } },
      tags: { include: { tag: true } },
    },
  });
}
