/**
 * @buildbase/database - Update Tag
 */

import { prisma } from "../index";
import type { MediaTag } from "../generated/client";
import type { UpdateTagInput } from "./types";
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
 * Update an existing tag
 */
export async function updateTag(id: string, data: UpdateTagInput): Promise<MediaTag> {
  // Verify tag exists
  const existingTag = await prisma.mediaTag.findUnique({
    where: { id },
  });

  if (!existingTag) {
    throw new Error("Tag not found");
  }

  // Validate tag name if provided
  if (data.name !== undefined) {
    validateTagName(data.name);
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined && data.name.trim() !== existingTag.name) {
    updateData.name = data.name.trim();

    // Update slug if name changed
    const baseSlug = generateSlug(data.name.trim());
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.mediaTag.findFirst({
        where: { workspaceId: existingTag.workspaceId, slug, NOT: { id } },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    updateData.slug = slug;
  }

  if (data.color !== undefined) {
    updateData.color = data.color;
  }

  return prisma.mediaTag.update({
    where: { id },
    data: updateData,
  });
}
