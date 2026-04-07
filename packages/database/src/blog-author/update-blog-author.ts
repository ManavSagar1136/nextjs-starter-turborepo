/**
 * @buildbase/database - Update Blog Author
 */

import type { PrismaClient, BlogAuthor } from "@prisma/client";
import type { UpdateBlogAuthorInput } from "./types";

export async function updateBlogAuthor(
  prisma: PrismaClient,
  id: string,
  data: UpdateBlogAuthorInput
): Promise<BlogAuthor> {
  return prisma.blogAuthor.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.username !== undefined && { username: data.username }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.links !== undefined && { links: data.links }),
    },
  });
}
