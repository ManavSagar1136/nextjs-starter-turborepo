/**
 * @buildbase/database - Get Doc Post
 */

import type { PrismaClient } from "@prisma/client";

export async function getDocPostById(prisma: PrismaClient, id: string) {
  return prisma.docPost.findFirst({
    where: { id, deleted: false },
    include: { folder: true },
  });
}

export async function getDocPostByPath(prisma: PrismaClient, path: string) {
  const parts = path.split("/");
  const slug = parts[parts.length - 1];
  const folderPath = parts.length > 1 ? parts.slice(0, -1).join("/") : null;

  if (folderPath) {
    const folder = await prisma.docFolder.findFirst({
      where: { path: folderPath, deleted: false },
    });
    if (folder) {
      const post = await prisma.docPost.findFirst({
        where: { slug, folderId: folder.id, published: true, deleted: false },
        include: { folder: true },
      });
      if (post) return post;
    }
  }

  return prisma.docPost.findFirst({
    where: { slug, folderId: null, published: true, deleted: false },
    include: { folder: true },
  });
}
