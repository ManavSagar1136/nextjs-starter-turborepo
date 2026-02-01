/**
 * @buildbase/database - Delete Asset
 */

import { AssetsRepository } from "../assets/assets.repository";

/**
 * Delete an asset by ID
 * Note: This only deletes from database. Storage deletion should be handled by the API route.
 */
export async function deleteAsset(id: string): Promise<void> {
  // Verify asset exists
  const asset = await AssetsRepository.findByIdAdmin(id);
  if (!asset) {
    throw new Error("Asset not found");
  }

  // Delete from database
  await AssetsRepository.delete(id);
}
