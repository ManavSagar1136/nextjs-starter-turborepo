/**
 * @buildbase/database - Get Doc Folder
 */

import type { PrismaClient, DocFolder } from "@prisma/client";

export async function getDocFolderById(prisma: PrismaClient, id: string): Promise<DocFolder | null> {
  return prisma.docFolder.findFirst({ where: { id, deleted: false } });
}

export async function getDocFolderBySlug(prisma: PrismaClient, slug: string): Promise<DocFolder | null> {
  return prisma.docFolder.findFirst({ where: { slug, deleted: false } });
}

export async function getDocFolderByPath(prisma: PrismaClient, path: string): Promise<DocFolder | null> {
  return prisma.docFolder.findFirst({ where: { path, deleted: false } });
}
