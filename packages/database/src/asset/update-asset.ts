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
export async function updateAsset(id: string, data: UpdateAssetInput, workspaceId?: string): Promise<void> {
  // Get asset before update
  const asset = workspaceId
    ? await AssetsRepository.findById(id, workspaceId)
    : await AssetsRepository.findByIdAdmin(id);

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
    // Only enforce workspace validation if both asset and folder have workspaceIds
    // For admin context (where workspaceId might be null), skip this validation
    if (asset.workspaceId && folder.workspaceId && folder.workspaceId !== asset.workspaceId) {
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

    // Validate all tags exist
    // For admin operations (skipWorkspaceValidation = true): allow any tag regardless of workspace
    // For user operations: tags must be in the same workspace as the asset
    if (tagIdsArray.length > 0) {
      const uniqueTagIds = [...new Set(tagIdsArray)];

      const tagWhere: any = {
        id: { in: uniqueTagIds },
      };

      // Only filter by workspaceId if:
      // 1. This is NOT an admin operation (skipWorkspaceValidation is false/undefined)
      // 2. AND the asset has a workspaceId
      // For admin operations, skip workspace validation entirely
      if (!data.skipWorkspaceValidation && asset.workspaceId) {
        tagWhere.workspaceId = asset.workspaceId;
      }
      // If skipWorkspaceValidation is true (admin), we don't add workspaceId filter
      // This allows admin to assign any tag to any asset, regardless of workspace

      const tags = await prisma.mediaTag.findMany({
        where: tagWhere,
      });

      if (tags.length !== uniqueTagIds.length) {
        // For admin, just check if tags exist (no workspace restriction)
        // For user, check if tags exist and are in same workspace
        const errorMessage = data.skipWorkspaceValidation
          ? "One or more tags not found"
          : "One or more tags not found or not in the same workspace";
        throw new Error(errorMessage);
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

  // Update asset isPublic if provided
  if (data.isPublic !== undefined) {
    if (typeof data.isPublic !== "boolean") {
      throw new Error("isPublic must be a boolean");
    }
    await AssetsRepository.update(id, {
      isPublic: data.isPublic,
    });
  }
}
