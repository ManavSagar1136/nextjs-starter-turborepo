/**
 * @buildbase/database - Get Blog Author
 */

import type { PrismaClient, BlogAuthor } from "@prisma/client";

export async function getBlogAuthorById(prisma: PrismaClient, id: string): Promise<BlogAuthor | null> {
  return prisma.blogAuthor.findFirst({ where: { id, deleted: false } });
}

export async function getBlogAuthorByUsername(prisma: PrismaClient, username: string): Promise<BlogAuthor | null> {
  return prisma.blogAuthor.findFirst({ where: { username, deleted: false } });
}
