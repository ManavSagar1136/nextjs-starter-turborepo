/**
 * @buildbase/database - Create Blog Tag
 */

import type { PrismaClient, BlogTag } from "@prisma/client";
import type { CreateBlogTagInput } from "./types";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createBlogTag(prisma: PrismaClient, data: CreateBlogTagInput): Promise<BlogTag> {
  const slug = data.slug || generateSlug(data.title);

  const existing = await prisma.blogTag.findUnique({ where: { slug } });
  if (existing) throw new Error(`Blog tag with slug "${slug}" already exists`);

  return prisma.blogTag.create({
    data: {
      title: data.title,
      slug,
      isPublic: data.isPublic ?? true,
    },
  });
}
