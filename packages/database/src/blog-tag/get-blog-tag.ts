/**
 * @buildbase/database - Get Blog Tag
 */

import type { PrismaClient, BlogTag } from "@prisma/client";

export async function getBlogTagById(prisma: PrismaClient, id: string): Promise<BlogTag | null> {
  return prisma.blogTag.findFirst({ where: { id, deleted: false } });
}

export async function getBlogTagBySlug(prisma: PrismaClient, slug: string): Promise<BlogTag | null> {
  return prisma.blogTag.findFirst({ where: { slug, deleted: false } });
}
