/**
 * @buildbase/database - Create Changelog Post
 */

import type { PrismaClient } from "@prisma/client";
import type { CreateChangelogPostInput } from "./types";

export async function createChangelogPost(prisma: PrismaClient, data: CreateChangelogPostInput) {
  return prisma.changelogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      version: data.version,
      description: data.description ?? null,
      content: data.content,
      published: data.published ?? false,
      publishedAt: data.publishedAt ?? null,
      releaseDate: data.releaseDate ?? null,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription ?? null,
      seoKeywords: data.seoKeywords ?? [],
      ...(data.createdById && { createdById: data.createdById }),
      ...(data.updatedById && { updatedById: data.updatedById }),
    },
  });
}
