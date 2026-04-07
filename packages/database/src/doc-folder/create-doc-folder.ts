/**
 * @buildbase/database - Create Doc Folder
 */

import type { PrismaClient, DocFolder } from "@prisma/client";
import type { CreateDocFolderInput } from "./types";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function computePath(prisma: PrismaClient, parentFolderId: string | undefined | null): Promise<string | null> {
  if (!parentFolderId) return null;
  const parent = await prisma.docFolder.findUnique({ where: { id: parentFolderId } });
  if (!parent) return null;
  return parent.path ? parent.path : parent.slug;
}

export async function createDocFolder(prisma: PrismaClient, data: CreateDocFolderInput): Promise<DocFolder> {
  const slug = data.slug || generateSlug(data.name);
  const parentPath = await computePath(prisma, data.parentFolderId);
  const path = parentPath ? `${parentPath}/${slug}` : slug;

  return prisma.docFolder.create({
    data: {
      name: data.name,
      slug,
      path,
      parentFolderId: data.parentFolderId ?? null,
    },
  });
}
