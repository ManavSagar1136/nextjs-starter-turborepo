/**
 * @buildbase/database - Get Blog Post
 */

import type { PrismaClient } from "@prisma/client";

const blogPostInclude = {
  folder: true,
  authors: { include: { author: true } },
  tags: { include: { tag: true } },
  suggestedPosts: { include: { suggestedPost: { include: { folder: true } } } },
} as const;

export async function getBlogPostById(prisma: PrismaClient, id: string) {
  return prisma.blogPost.findFirst({
    where: { id, deleted: false },
    include: blogPostInclude,
  });
}

export async function getBlogPostByPath(prisma: PrismaClient, path: string) {
  // path format: "folderPath/slug" or just "slug"
  const parts = path.split("/");
  const slug = parts[parts.length - 1];
  const folderPath = parts.length > 1 ? parts.slice(0, -1).join("/") : null;

  if (folderPath) {
    // Look up folder by path, then find post with matching slug in that folder
    const folder = await prisma.blogFolder.findFirst({
      where: { path: folderPath, deleted: false },
    });
    if (folder) {
      const post = await prisma.blogPost.findFirst({
        where: { slug, folderId: folder.id, published: true, deleted: false },
        include: blogPostInclude,
      });
      if (post) return post;
    }
  }

  // Fallback: root-level post (no folder)
  return prisma.blogPost.findFirst({
    where: { slug, folderId: null, published: true, deleted: false },
    include: blogPostInclude,
  });
}
