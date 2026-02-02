/**
 * @buildbase/database - Get Asset
 */

import { AssetsRepository } from "../assets/assets.repository";
import type { AssetWithDetails } from "./types";

/**
 * Get asset by ID with full details (admin context - no workspace filter)
 */
export async function getAssetById(id: string, workspaceId?: string): Promise<AssetWithDetails | null> {
  const asset = await AssetsRepository.findWithDetails(id, workspaceId);

  if (!asset) {
    return null;
  }

  return {
    id: asset.id,
    filename: asset.filename,
    url: asset.url,
    path: asset.path,
    size: asset.size,
    contentType: asset.contentType,
    isPublic: asset.isPublic,
    metadata: asset.metadata as Record<string, unknown> | null,
    folder: asset.folder,
    tags: asset.tags,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}
