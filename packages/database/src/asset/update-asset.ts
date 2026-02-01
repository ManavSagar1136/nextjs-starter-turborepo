/**
 * @buildbase/database - Update Asset
 */

import { prisma } from "../index";
import { AssetsRepository } from "../assets/assets.repository";
import type { UpdateAssetInput } from "./types";
import { MAX_TAGS_PER_ASSET } from "./constants";

/**
 * Update an asset (folderId, tagIds)
 */
export async function updateAsset(id: string, data: UpdateAssetInput): Promise<void> {
  // Get asset before update
  const asset = await AssetsRepository.findByIdAdmin(id);
  if (!asset) {
    throw new Error("Asset not found");
  }

  // Validate folder exists if folderId is provided
  if (data.folderId !== undefined && data.folderId !== null) {
    const folder = await prisma.assetFolder.findUnique({
      where: { id: data.folderId },
    });
    if (!folder) {
      throw new Error("Folder not found");
    }
    // Ensure folder is in the same workspace as the asset
    if (folder.workspaceId !== asset.workspaceId) {
      throw new Error("Folder must be in the same workspace as the asset");
    }
  }

  // Validate tags exist if tagIds is provided
  if (data.tagIds !== undefined) {
    if (!Array.isArray(data.tagIds)) {
      throw new Error("tagIds must be an array");
    }

    // Ensure all tagIds are strings
    const tagIdsArray = data.tagIds.filter((id): id is string => typeof id === "string" && id.length > 0);

    // Check tag limit (max 20 tags per asset)
    if (tagIdsArray.length > MAX_TAGS_PER_ASSET) {
      throw new Error(`Maximum ${MAX_TAGS_PER_ASSET} tags per asset allowed`);
    }

    // Validate all tags exist and are in the same workspace
    if (tagIdsArray.length > 0) {
      const uniqueTagIds = [...new Set(tagIdsArray)];
      const tags = await prisma.mediaTag.findMany({
        where: {
          id: { in: uniqueTagIds },
          workspaceId: asset.workspaceId,
        },
      });

      if (tags.length !== uniqueTagIds.length) {
        throw new Error("One or more tags not found or not in the same workspace");
      }

      // Update asset tags (replace all existing tags)
      await AssetsRepository.setTags(id, uniqueTagIds);
    } else {
      // Empty array means remove all tags
      await AssetsRepository.setTags(id, []);
    }
  }

  // Update asset folderId if provided
  if (data.folderId !== undefined) {
    await AssetsRepository.update(id, {
      folderId: data.folderId === null ? null : data.folderId,
    });
  }

  // Update asset filename if provided
  if (data.filename !== undefined) {
    if (typeof data.filename !== "string" || data.filename.trim().length === 0) {
      throw new Error("Filename must be a non-empty string");
    }
    await AssetsRepository.update(id, {
      filename: data.filename.trim(),
    });
  }

  // Update asset metadata if provided
  if (data.metadata !== undefined) {
    // Validate metadata is an object
    if (data.metadata !== null && typeof data.metadata !== "object") {
      throw new Error("Metadata must be an object or null");
    }
    await AssetsRepository.update(id, {
      metadata: data.metadata,
    });
  }
}
