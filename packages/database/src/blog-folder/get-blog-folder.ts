/**
 * @buildbase/database - Get Blog Folder
 */

import type { PrismaClient, BlogFolder } from "@prisma/client";

export async function getBlogFolderById(prisma: PrismaClient, id: string): Promise<BlogFolder | null> {
  return prisma.blogFolder.findFirst({ where: { id, deleted: false } });
}

export async function getBlogFolderBySlug(prisma: PrismaClient, slug: string): Promise<BlogFolder | null> {
  return prisma.blogFolder.findFirst({ where: { slug, deleted: false } });
}

export async function getBlogFolderByPath(prisma: PrismaClient, path: string): Promise<BlogFolder | null> {
  return prisma.blogFolder.findFirst({ where: { path, deleted: false } });
}
