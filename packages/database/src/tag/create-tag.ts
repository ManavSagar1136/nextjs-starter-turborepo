/**
 * @buildbase/database - Create Tag
 */

import { prisma } from "../index";
import type { MediaTag } from "@prisma/client";
import type { CreateTagInput } from "./types";
import { validateTagName } from "../assets/validation.utils";

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Create a new tag
 */
export async function createTag(data: CreateTagInput): Promise<MediaTag> {
  // Validate tag name format (length and characters)
  validateTagName(data.name);

  // If workspaceId not provided (admin context), set to null
  // This allows admin to create global tags without workspace association
  const finalWorkspaceId: string | null = data.workspaceId === undefined ? null : (data.workspaceId ?? null);

  // Generate slug
  const baseSlug = generateSlug(data.name.trim());
  let slug = baseSlug;
  let counter = 1;

  // Ensure unique slug within workspace (or null workspace for admin tags)
  while (true) {
    const where: Record<string, unknown> = { slug };
    if (finalWorkspaceId === null) {
      where.workspaceId = null;
    } else {
      where.workspaceId = finalWorkspaceId;
    }
    const existing = await prisma.mediaTag.findFirst({ where });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const createData: {
    name: string;
    slug: string;
    color: string | null;
    workspaceId: string | null;
    userId: string;
  } = {
    name: data.name.trim(),
    slug,
    color: data.color || null,
    workspaceId: finalWorkspaceId,
    userId: data.userId,
  };

  return prisma.mediaTag.create({
    data: createData as any,
  });
}
