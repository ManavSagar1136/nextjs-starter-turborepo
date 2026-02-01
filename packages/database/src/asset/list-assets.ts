/**
 * @buildbase/database - List Assets
 */

import { prisma } from "../index";
import type { ListAssetsOptions, PaginatedAssets } from "./types";
import { buildAssetFilter, type AssetFilterOptions } from "../assets/assets.filters";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./constants";

/**
 * List assets with pagination and filters
 */
export async function listAssets(options: ListAssetsOptions = {}): Promise<PaginatedAssets> {
  const { workspaceId, folderId, tagIds, search, contentType, isPublic, page = 1, limit = DEFAULT_PAGE_SIZE } = options;

  const finalLimit = Math.min(limit, MAX_PAGE_SIZE);
  const skip = (page - 1) * finalLimit;

  // Build filters
  const filters: AssetFilterOptions = {};

  if (folderId !== undefined) {
    filters.folderId = folderId;
  }

  if (tagIds && tagIds.length > 0) {
    filters.tagIds = tagIds;
  }

  if (search) {
    filters.search = search;
  }

  if (contentType) {
    filters.contentType = Array.isArray(contentType) ? contentType : contentType;
  }

  if (isPublic !== undefined) {
    filters.isPublic = isPublic;
  }

  // Build where clause - for admin, workspaceId is optional
  const where = workspaceId ? buildAssetFilter(workspaceId, filters) : buildAssetFilter(undefined, filters);

  // Query assets with pagination
  const [assets, totalDocs] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        folder: {
          select: { id: true, name: true },
        },
        assetTags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true, color: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        workspace: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: finalLimit,
    }),
    prisma.asset.count({ where }),
  ]);

  // Transform response
  const docs = assets.map(asset => ({
    id: asset.id,
    name: asset.filename,
    filename: asset.filename,
    url: asset.url,
    path: asset.path,
    size: asset.size,
    contentType: asset.contentType,
    isPublic: asset.isPublic,
    metadata: asset.metadata as Record<string, unknown> | null,
    folder: asset.folder,
    tags: asset.assetTags.map(at => at.tag).filter((tag): tag is NonNullable<typeof tag> => tag !== null),
    user: asset.user,
    workspace: asset.workspace,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  }));

  const totalPages = Math.ceil(totalDocs / finalLimit);

  return {
    docs,
    totalDocs,
    limit: finalLimit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
