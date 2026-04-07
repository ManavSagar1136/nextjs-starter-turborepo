/**
 * @buildbase/database - Create Blog Author
 */

import type { PrismaClient, BlogAuthor } from "@prisma/client";
import type { CreateBlogAuthorInput } from "./types";

export async function createBlogAuthor(prisma: PrismaClient, data: CreateBlogAuthorInput): Promise<BlogAuthor> {
  const existing = await prisma.blogAuthor.findUnique({ where: { username: data.username } });
  if (existing) throw new Error(`Blog author with username "${data.username}" already exists`);

  return prisma.blogAuthor.create({
    data: {
      name: data.name,
      username: data.username,
      image: data.image ?? null,
      links: data.links ?? null,
    },
  });
}
