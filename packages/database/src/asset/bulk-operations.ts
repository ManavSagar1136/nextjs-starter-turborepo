/**
 * @buildbase/database - Bulk Asset Operations
 *
 * Service functions for bulk operations on assets:
 * - Bulk delete
 * - Bulk move to folder
 * - Bulk assign/remove tags
 */

import { prisma } from "../index";
import { AssetsRepository } from "../assets/assets.repository";
import { MAX_TAGS_PER_ASSET } from "./constants";

export interface BulkOperationError {
  assetId: string;
  error: string;
}

export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: BulkOperationError[];
}

const MAX_BULK_OPERATION_SIZE = 100;

/**
 * Validate bulk operation size
 */
function validateBulkOperationSize(assetIds: string[]): void {
  if (assetIds.length === 0) {
    throw new Error("At least one asset ID is required");
  }
  if (assetIds.length > MAX_BULK_OPERATION_SIZE) {
    throw new Error(`Maximum ${MAX_BULK_OPERATION_SIZE} assets per bulk operation allowed`);
  }
}

/**
 * Verify all assets belong to workspace
 */
async function verifyAssetOwnership(
  assetIds: string[],
  workspaceId: string | null
): Promise<{ valid: string[]; invalid: BulkOperationError[] }> {
  const where: Record<string, unknown> = {
    id: { in: assetIds },
  };

  if (workspaceId !== null) {
    where.workspaceId = workspaceId;
  } else {
    where.workspaceId = null;
  }

  const validAssets = await prisma.asset.findMany({
    where,
    select: { id: true },
  });

  const validIds = new Set(validAssets.map(a => a.id));
  const invalid: BulkOperationError[] = assetIds
    .filter(id => !validIds.has(id))
    .map(id => ({
      assetId: id,
      error: "Asset not found or does not belong to workspace",
    }));

  return {
    valid: validAssets.map(a => a.id),
    invalid,
  };
}

/**
 * Bulk delete assets
 */
export async function bulkDeleteAssets(assetIds: string[], workspaceId: string | null): Promise<BulkOperationResult> {
  validateBulkOperationSize(assetIds);

  // Verify ownership
  const { valid, invalid } = await verifyAssetOwnership(assetIds, workspaceId);

  if (valid.length === 0) {
    return {
      successCount: 0,
      failureCount: assetIds.length,
      errors: invalid,
    };
  }

  // Delete assets
  const errors: BulkOperationError[] = [...invalid];
  let successCount = 0;

  for (const assetId of valid) {
    try {
      await AssetsRepository.delete(assetId);
      successCount++;
    } catch (error) {
      errors.push({
        assetId,
        error: error instanceof Error ? error.message : "Failed to delete asset",
      });
    }
  }

  return {
    successCount,
    failureCount: errors.length,
    errors,
  };
}

/**
 * Bulk move assets to folder
 */
export async function bulkMoveAssets(
  assetIds: string[],
  folderId: string | null,
  workspaceId: string | null
): Promise<BulkOperationResult> {
  validateBulkOperationSize(assetIds);

  // Verify folder exists if provided
  if (folderId !== null) {
    const where: Record<string, unknown> = { id: folderId };
    if (workspaceId !== null) {
      where.workspaceId = workspaceId;
    } else {
      where.workspaceId = null;
    }

    const folder = await prisma.assetFolder.findFirst({ where });
    if (!folder) {
      throw new Error("Folder not found or does not belong to workspace");
    }
  }

  // Verify ownership
  const { valid, invalid } = await verifyAssetOwnership(assetIds, workspaceId);

  if (valid.length === 0) {
    return {
      successCount: 0,
      failureCount: assetIds.length,
      errors: invalid,
    };
  }

  // Move assets
  const errors: BulkOperationError[] = [...invalid];
  let successCount = 0;

  for (const assetId of valid) {
    try {
      await AssetsRepository.update(assetId, {
        folderId: folderId === null ? null : folderId,
      });
      successCount++;
    } catch (error) {
      errors.push({
        assetId,
        error: error instanceof Error ? error.message : "Failed to move asset",
      });
    }
  }

  return {
    successCount,
    failureCount: errors.length,
    errors,
  };
}

/**
 * Bulk assign tags to assets
 */
export async function bulkAssignTags(
  assetIds: string[],
  tagIds: string[],
  workspaceId: string | null
): Promise<BulkOperationResult> {
  validateBulkOperationSize(assetIds);

  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    throw new Error("At least one tag ID is required");
  }

  // Verify tags exist
  const where: Record<string, unknown> = {
    id: { in: tagIds },
  };

  if (workspaceId !== null) {
    where.workspaceId = workspaceId;
  } else {
    where.workspaceId = null;
  }

  const validTags = await prisma.mediaTag.findMany({
    where,
    select: { id: true },
  });

  const validTagIds = new Set(validTags.map(t => t.id));
  const invalidTagIds = tagIds.filter(id => !validTagIds.has(id));

  if (invalidTagIds.length > 0) {
    throw new Error(`One or more tags not found: ${invalidTagIds.join(", ")}`);
  }

  // Verify ownership
  const { valid, invalid } = await verifyAssetOwnership(assetIds, workspaceId);

  if (valid.length === 0) {
    return {
      successCount: 0,
      failureCount: assetIds.length,
      errors: invalid,
    };
  }

  // Assign tags to assets
  const errors: BulkOperationError[] = [...invalid];
  let successCount = 0;

  for (const assetId of valid) {
    try {
      // Get current tags for asset
      const asset = await AssetsRepository.findByIdAdmin(assetId);
      if (!asset) {
        errors.push({
          assetId,
          error: "Asset not found",
        });
        continue;
      }

      // Get current tag IDs
      const currentAssetTags = await prisma.assetTag.findMany({
        where: { assetId },
        select: { tagId: true },
      });

      const currentTagIds = currentAssetTags.map(at => at.tagId);
      const newTagIds = [...new Set([...currentTagIds, ...tagIds])];

      // Check tag limit
      if (newTagIds.length > MAX_TAGS_PER_ASSET) {
        errors.push({
          assetId,
          error: `Maximum ${MAX_TAGS_PER_ASSET} tags per asset allowed. Current: ${currentTagIds.length}, Adding: ${tagIds.length}`,
        });
        continue;
      }

      // Update tags
      await AssetsRepository.setTags(assetId, newTagIds);
      successCount++;
    } catch (error) {
      errors.push({
        assetId,
        error: error instanceof Error ? error.message : "Failed to assign tags",
      });
    }
  }

  return {
    successCount,
    failureCount: errors.length,
    errors,
  };
}

/**
 * Bulk remove tags from assets
 */
export async function bulkRemoveTags(
  assetIds: string[],
  tagIds: string[],
  workspaceId: string | null
): Promise<BulkOperationResult> {
  validateBulkOperationSize(assetIds);

  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    throw new Error("At least one tag ID is required");
  }

  // Verify ownership
  const { valid, invalid } = await verifyAssetOwnership(assetIds, workspaceId);

  if (valid.length === 0) {
    return {
      successCount: 0,
      failureCount: assetIds.length,
      errors: invalid,
    };
  }

  // Remove tags from assets
  const errors: BulkOperationError[] = [...invalid];
  let successCount = 0;

  for (const assetId of valid) {
    try {
      // Get current tag IDs
      const currentAssetTags = await prisma.assetTag.findMany({
        where: { assetId },
        select: { tagId: true },
      });

      const currentTagIds = currentAssetTags.map(at => at.tagId);
      const newTagIds = currentTagIds.filter(id => !tagIds.includes(id));

      // Update tags
      await AssetsRepository.setTags(assetId, newTagIds);
      successCount++;
    } catch (error) {
      errors.push({
        assetId,
        error: error instanceof Error ? error.message : "Failed to remove tags",
      });
    }
  }

  return {
    successCount,
    failureCount: errors.length,
    errors,
  };
}
