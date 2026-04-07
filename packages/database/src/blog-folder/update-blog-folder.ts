/**
 * @buildbase/database - Update Blog Folder
 */

import type { PrismaClient, BlogFolder } from "@prisma/client";
import type { UpdateBlogFolderInput } from "./types";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function computePath(
  prisma: PrismaClient,
  slug: string,
  parentFolderId: string | null | undefined
): Promise<string> {
  if (!parentFolderId) return slug;
  const parent = await prisma.blogFolder.findUnique({ where: { id: parentFolderId } });
  if (!parent) return slug;
  return parent.path ? `${parent.path}/${slug}` : `${parent.slug}/${slug}`;
}

export async function updateBlogFolder(
  prisma: PrismaClient,
  id: string,
  data: UpdateBlogFolderInput
): Promise<BlogFolder> {
  const existing = await prisma.blogFolder.findUnique({ where: { id } });
  if (!existing) throw new Error(`Blog folder with id "${id}" not found`);

  const slug = data.slug || (data.name ? generateSlug(data.name) : existing.slug);
  const parentFolderId = data.parentFolderId !== undefined ? data.parentFolderId : existing.parentFolderId;
  const path = await computePath(prisma, slug, parentFolderId);

  return prisma.blogFolder.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      slug,
      path,
      parentFolderId,
    },
  });
}
