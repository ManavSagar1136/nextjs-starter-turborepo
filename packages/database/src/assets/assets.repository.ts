/**
 * Asset repository for database operations
 * All Prisma queries for assets are centralized here
 */

import { prisma } from "../index";

// Select fields for related entities
export const FOLDER_SELECT_FIELDS = {
  id: true,
  name: true,
} as const;

export const TAG_SELECT_FIELDS = {
  id: true,
  name: true,
  slug: true,
  color: true,
} as const;

export const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
} as const;

export interface CreateAssetParams {
  filename: string;
  path: string;
  url: string;
  size: number;
  contentType: string;
  bucket: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  workspaceId: string;
  userId: string;
  folderId?: string;
}

export interface UpdateAssetParams {
  filename?: string;
  path?: string;
  url?: string;
  size?: number;
  contentType?: string;
  bucket?: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
  folderId?: string | null;
}

/**
 * Asset Repository - all database operations for assets
 */
export class AssetsRepository {
  /**
   * Create a new asset record
   */
  static async create(params: CreateAssetParams) {
    return prisma.asset.create({
      data: {
        filename: params.filename,
        path: params.path,
        url: params.url,
        size: params.size,
        contentType: params.contentType,
        bucket: params.bucket,
        isPublic: params.isPublic,
        metadata: params.metadata,
        workspaceId: params.workspaceId,
        userId: params.userId,
        folderId: params.folderId,
      },
    });
  }

  /**
   * Get asset by ID with optional workspace filter
   */
  static async findById(id: string, workspaceId?: string) {
    const where: Record<string, unknown> = { id };
    if (workspaceId !== undefined) {
      where.workspaceId = workspaceId;
    }

    return prisma.asset.findFirst({ where });
  }

  /**
   * Get asset by ID without workspace filter (admin context)
   */
  static async findByIdAdmin(id: string) {
    return prisma.asset.findUnique({
      where: { id },
    });
  }

  /**
   * Get asset with full details (folder, tags, user)
   */
  static async findWithDetails(id: string, workspaceId?: string) {
    const where: Record<string, unknown> = { id };
    if (workspaceId !== undefined) {
      where.workspaceId = workspaceId;
    }

    const include: Record<string, unknown> = {
      folder: {
        select: FOLDER_SELECT_FIELDS,
      },
      assetTags: {
        include: {
          tag: {
            select: TAG_SELECT_FIELDS,
          },
        },
      },
      user: {
        select: USER_SELECT_FIELDS,
      },
    };

    // Include workspace relation for admin context
    if (workspaceId === undefined) {
      include.workspace = {
        select: {
          id: true,
          name: true,
        },
      };
    }

    const asset = await prisma.asset.findFirst({
      where,
      include,
    });

    if (!asset) {
      return null;
    }

    // Format response
    const folder = asset.folder
      ? {
          id: (asset.folder as { id: string; name: string }).id,
          name: (asset.folder as { id: string; name: string }).name,
        }
      : null;

    const tags = (
      asset.assetTags as Array<{
        tag: { id: string; name: string; slug: string; color: string | null } | null;
      }>
    )
      .map(at => at.tag)
      .filter(Boolean);

    return {
      ...asset,
      folder,
      tags,
    };
  }

  /**
   * Find assets by user ID
   */
  static async findByUser(userId: string, workspaceId: string) {
    return prisma.asset.findMany({
      where: {
        userId,
        workspaceId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find assets by workspace ID
   */
  static async findByWorkspace(workspaceId: string) {
    return prisma.asset.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update an asset
   */
  static async update(id: string, data: UpdateAssetParams) {
    return prisma.asset.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an asset
   */
  static async delete(id: string) {
    return prisma.asset.delete({
      where: { id },
    });
  }

  /**
   * Count assets by workspace
   */
  static async countByWorkspace(workspaceId: string) {
    return prisma.asset.count({
      where: { workspaceId },
    });
  }

  /**
   * Sum storage used by workspace
   */
  static async sumStorageByWorkspace(workspaceId: string) {
    const result = await prisma.asset.aggregate({
      where: { workspaceId },
      _sum: {
        size: true,
      },
    });
    return result._sum.size || 0;
  }

  /**
   * Find assets by folder
   */
  static async findByFolder(folderId: string | null, workspaceId: string) {
    return prisma.asset.findMany({
      where: {
        folderId,
        workspaceId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Move asset to folder
   */
  static async moveToFolder(id: string, folderId: string | null) {
    return prisma.asset.update({
      where: { id },
      data: { folderId },
    });
  }

  /**
   * Bulk move assets to folder
   */
  static async bulkMoveToFolder(ids: string[], folderId: string | null) {
    return prisma.asset.updateMany({
      where: { id: { in: ids } },
      data: { folderId },
    });
  }

  /**
   * Get asset tags
   */
  static async getAssetTags(assetId: string) {
    const assetTags = await prisma.assetTag.findMany({
      where: { assetId },
      include: {
        tag: {
          select: TAG_SELECT_FIELDS,
        },
      },
    });

    return assetTags.map(at => at.tag);
  }

  /**
   * Add tags to asset
   */
  static async addTags(assetId: string, tagIds: string[]) {
    const data = tagIds.map(tagId => ({
      assetId,
      tagId,
    }));

    return prisma.assetTag.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Remove tags from asset
   */
  static async removeTags(assetId: string, tagIds: string[]) {
    return prisma.assetTag.deleteMany({
      where: {
        assetId,
        tagId: { in: tagIds },
      },
    });
  }

  /**
   * Set asset tags (replace all)
   */
  static async setTags(assetId: string, tagIds: string[]) {
    // Delete existing tags
    await prisma.assetTag.deleteMany({
      where: { assetId },
    });

    // Add new tags
    if (tagIds.length > 0) {
      await this.addTags(assetId, tagIds);
    }
  }
}
