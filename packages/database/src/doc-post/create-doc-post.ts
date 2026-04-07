/**
 * @buildbase/database - Create Doc Post
 */

import type { PrismaClient } from "@prisma/client";
import type { CreateDocPostInput } from "./types";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createDocPost(prisma: PrismaClient, data: CreateDocPostInput, updatedById?: string) {
  const slug = data.slug || generateSlug(data.title);

  return prisma.docPost.create({
    data: {
      title: data.title,
      slug,
      subtitle: data.subtitle ?? null,
      description: data.description ?? null,
      content: data.content,
      order: data.order ?? null,
      published: data.published ?? false,
      publishedAt: data.published ? new Date() : null,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      seoKeywords: data.seoKeywords ?? [],
      folderId: data.folderId ?? null,
      updatedById: updatedById ?? null,
    },
    include: { folder: true },
  });
}
