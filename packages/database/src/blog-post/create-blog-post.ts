/**
 * @buildbase/database - Create Blog Post
 */

import type { PrismaClient } from "@prisma/client";
import type { CreateBlogPostInput } from "./types";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createBlogPost(prisma: PrismaClient, data: CreateBlogPostInput, creatorId?: string) {
  let slug = data.slug || generateSlug(data.title);

  // Deduplicate slug: if already taken in the same folder, append timestamp
  const existing = await prisma.blogPost.findFirst({
    where: { slug, folderId: data.folderId ?? null, deleted: false },
  });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  return prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      excerpt: data.excerpt ?? null,
      content: data.content,
      image: data.image ?? null,
      imageTitle: data.imageTitle ?? null,
      assetFileId: data.assetFileId ?? null,
      featured: data.featured ?? false,
      published: data.published ?? false,
      publishedAt: data.published ? new Date() : null,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      seoKeywords: data.seoKeywords ?? [],
      folderId: data.folderId ?? null,
      creatorId: creatorId ?? null,
      updatedById: creatorId ?? null,
    },
    include: {
      folder: true,
      assetFile: true,
      authors: { include: { author: true } },
      tags: { include: { tag: true } },
    },
  });
}
