/**
 * @buildbase/database - Update Blog Tag
 */

import type { PrismaClient, BlogTag } from "@prisma/client";
import type { UpdateBlogTagInput } from "./types";

export async function updateBlogTag(prisma: PrismaClient, id: string, data: UpdateBlogTagInput): Promise<BlogTag> {
  return prisma.blogTag.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  });
}
