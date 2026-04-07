/**
 * @buildbase/database - Update Doc Folder
 */

import type { PrismaClient, DocFolder } from "@prisma/client";
import type { UpdateDocFolderInput } from "./types";

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
  const parent = await prisma.docFolder.findUnique({ where: { id: parentFolderId } });
  if (!parent) return slug;
  return parent.path ? `${parent.path}/${slug}` : `${parent.slug}/${slug}`;
}

export async function updateDocFolder(
  prisma: PrismaClient,
  id: string,
  data: UpdateDocFolderInput
): Promise<DocFolder> {
  const existing = await prisma.docFolder.findUnique({ where: { id } });
  if (!existing) throw new Error(`Doc folder with id "${id}" not found`);

  const slug = data.slug || (data.name ? generateSlug(data.name) : existing.slug);
  const parentFolderId = data.parentFolderId !== undefined ? data.parentFolderId : existing.parentFolderId;
  const path = await computePath(prisma, slug, parentFolderId);

  return prisma.docFolder.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      slug,
      path,
      parentFolderId,
    },
  });
}
