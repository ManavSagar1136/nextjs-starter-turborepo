/**
 * @buildbase/database - Duplicate Asset
 */

import { prisma } from "../index";
import { AssetsRepository } from "../assets/assets.repository";
import { getStorage } from "@buildbase/storage";
import type { Prisma } from "../generated/client";

/**
 * Duplicate an asset
 * Creates a copy of the asset with a new ID but same file
 */
export async function duplicateAsset(id: string, workspaceId: string | null): Promise<string> {
  // Get the original asset with tags included
  const originalAsset = workspaceId
    ? await AssetsRepository.findWithDetails(id, workspaceId)
    : await AssetsRepository.findWithDetails(id);

  if (!originalAsset) {
    throw new Error("Asset not found");
  }

  // Get storage instance
  const storage = await getStorage();

  // Copy the file in storage
  let newPath: string;
  let newUrl: string;

  try {
    // Generate new path (same directory, new filename with timestamp)
    const pathParts = originalAsset.path.split("/");
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      throw new Error("Invalid asset path: missing filename");
    }

    const ext = filename.includes(".") ? filename.substring(filename.lastIndexOf(".")) : "";
    const nameWithoutExt = filename.includes(".") ? filename.substring(0, filename.lastIndexOf(".")) : filename;
    const newFilename = `${nameWithoutExt}_copy_${Date.now()}${ext}`;
    pathParts[pathParts.length - 1] = newFilename;
    newPath = pathParts.join("/");

    // Copy file in storage
    await storage.copy(originalAsset.path, newPath);

    // Get the new URL (use public URL if asset is public, otherwise signed URL)
    if (originalAsset.isPublic) {
      const publicUrl = await storage.getPublicUrl(newPath);
      newUrl = publicUrl || originalAsset.url; // Fallback to original URL if public URL not available
    } else {
      // For private files, use signed URL (valid for 1 hour = 60 minutes)
      newUrl = await storage.getSignedUrl(newPath, { expiresInMinutes: 60 });
    }
  } catch (storageError) {
    console.error("Error copying file in storage:", storageError);
    throw new Error("Failed to copy asset file in storage");
  }

  // Generate new filename for the duplicate
  const originalFilename = originalAsset.filename || "asset";
  const filenameExt = originalFilename.match(/\.[^/.]+$/)?.[0] || "";
  const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
  const newFilename = `${filenameWithoutExt}_copy${filenameExt}`;

  // Prepare metadata for Prisma (must be InputJsonValue)
  let metadataValue: Prisma.InputJsonValue | null = null;
  if (originalAsset.metadata) {
    try {
      // Deep clone and ensure it's a valid JSON value
      metadataValue = JSON.parse(JSON.stringify(originalAsset.metadata)) as Prisma.InputJsonValue;
    } catch {
      // If metadata is invalid JSON, set to null
      metadataValue = null;
    }
  }

  // Create new asset record
  const newAsset = await prisma.asset.create({
    data: {
      filename: newFilename,
      url: newUrl,
      path: newPath,
      size: originalAsset.size,
      contentType: originalAsset.contentType,
      bucket: originalAsset.bucket,
      isPublic: originalAsset.isPublic,
      metadata: metadataValue,
      folderId: originalAsset.folderId,
      workspaceId: originalAsset.workspaceId,
      userId: originalAsset.userId,
    },
  });

  // Copy tags if the original asset has any
  if (originalAsset.tags && originalAsset.tags.length > 0) {
    const tagIds = originalAsset.tags.map(tag => tag.id).filter((tagId): tagId is string => typeof tagId === "string");

    if (tagIds.length > 0) {
      await AssetsRepository.setTags(newAsset.id, tagIds);
    }
  }

  return newAsset.id;
}
