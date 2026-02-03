/**
 * Media Library API Service
 *
 * Client-side API for interacting with media library endpoints.
 * Implements the IMediaLibraryApi interface from @buildbase/components/media-library.
 */

import { ApiController } from "@buildbase/http-client/controller";
import { HttpClientConfig } from "@buildbase/http-client/types";
import { env } from "@buildbase/env";
import type {
  IMediaLibraryApi,
  IAsset,
  IPaginationResponse,
  IAssetListParams,
  IFolderListParams,
  IFolderTreeItem,
  IFolder,
  ITag,
} from "@buildbase/components/media-library";

/**
 * Default HTTP client configuration for media library service
 */
const getDefaultConfig = (): HttpClientConfig => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : env.NEXT_PUBLIC_USER_APP_URL;

  return {
    serverUrl: `${baseUrl}/api`,
    secretKey: env.NEXT_PUBLIC_API_SECRET,
    encryptData: false,
    storageKeys: {
      TOKEN: "token",
    },
  };
};

export class MediaLibraryService extends ApiController implements IMediaLibraryApi {
  protected urlPath = "/assets"; // Default, but we override in each method

  constructor() {
    super(getDefaultConfig());
  }
  // ============================================================================
  // Assets
  // ============================================================================

  async getAssets(params?: IAssetListParams): Promise<IPaginationResponse<IAsset>> {
    const query: Record<string, string> = {};

    if (params?.$page) query.$page = String(params.$page);
    if (params?.$limit) query.$limit = String(params.$limit);
    if (params?.folderId !== undefined) {
      query.folderId = params.folderId === null ? "null" : params.folderId;
    }
    if (params?.tagIds?.length) query.tagIds = params.tagIds.join(",");
    if (params?.search) query.search = params.search;
    if (params?.contentType) {
      query.contentType = Array.isArray(params.contentType) ? params.contentType.join(",") : params.contentType;
    }
    if (params?.isPublic !== undefined) query.isPublic = String(params.isPublic);
    if (params?.sortBy) query.sortBy = params.sortBy;
    if (params?.sortOrder) query.sortOrder = params.sortOrder;

    const response = await this.get("/assets", query);
    return response.data;
  }

  async getAsset(assetId: string): Promise<IAsset> {
    const response = await this.get(`/assets/${assetId}`, {}, {});
    return response.data.data;
  }

  async updateAsset(
    assetId: string,
    params: {
      filename?: string;
      folderId?: string | null;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<IAsset> {
    // If only metadata/filename, use metadata endpoint
    if (
      (params.filename !== undefined || params.metadata !== undefined) &&
      params.folderId === undefined &&
      params.tags === undefined
    ) {
      const response = await this.patch(
        `/assets/${assetId}/metadata`,
        {},
        {},
        {
          filename: params.filename,
          metadata: params.metadata,
        }
      );
      return response.data.data;
    }
    // Otherwise use main update endpoint
    const response = await this.patch(`/assets/${assetId}`, {}, {}, params);
    return response.data.data;
  }

  async duplicateAsset(assetId: string): Promise<IAsset> {
    const response = await this.post(`/assets/${assetId}/duplicate`, {}, {}, {});
    return response.data.data;
  }

  async deleteAsset(assetId: string, force?: boolean): Promise<void> {
    await this.delete(`/assets/${assetId}`, force ? { force: "true" } : {}, {});
  }

  async toggleAssetPrivacy(assetId: string, makePublic: boolean): Promise<IAsset> {
    const response = await this.patch(`/assets/${assetId}`, {}, {}, { isPublic: makePublic });
    return response.data.data;
  }

  async getAssetDownloadUrl(assetId: string): Promise<{
    url: string;
    filename: string;
    expiresAt: string;
  }> {
    const response = await this.get(`/assets/${assetId}/download`, {}, {});
    return response.data.data;
  }

  // ============================================================================
  // Folders
  // ============================================================================

  async getFolderTree(): Promise<IFolderTreeItem[]> {
    const response = await this.get("/folders/tree", {}, {});
    return response.data.data.tree;
  }

  async getFolders(params?: IFolderListParams): Promise<IPaginationResponse<IFolder>> {
    const query: Record<string, string> = {};

    if (params?.$page) query.$page = String(params.$page);
    if (params?.$limit) query.$limit = String(params.$limit);
    if (params?.parentFolderId !== undefined) {
      query.parentFolderId = params.parentFolderId === null ? "null" : params.parentFolderId;
    }
    if (params?.search) query.search = params.search;

    const response = await this.get("/folders", query);
    return response.data;
  }

  async getFolder(folderId: string): Promise<IFolder> {
    const response = await this.get(`/folders/${folderId}`, {}, {});
    return response.data.data;
  }

  async createFolder(params: { name: string; parentFolderId?: string | null; description?: string }): Promise<IFolder> {
    const response = await this.post("/folders", {}, {}, params);
    return response.data.data;
  }

  async updateFolder(folderId: string, params: { name?: string; description?: string }): Promise<IFolder> {
    const response = await this.patch(`/folders/${folderId}`, {}, {}, params);
    return response.data.data;
  }

  async deleteFolder(folderId: string, recursive?: boolean): Promise<void> {
    await this.delete(`/folders/${folderId}`, recursive ? { recursive: "true" } : {}, {});
  }

  async moveFolder(folderId: string, targetParentFolderId: string | null): Promise<IFolder> {
    const response = await this.post(
      `/folders/${folderId}/move`,
      {},
      {},
      {
        targetParentFolderId,
      }
    );
    return response.data.data;
  }

  // ============================================================================
  // Tags
  // ============================================================================

  async getTags(params?: {
    search?: string;
    $page?: number;
    $limit?: number;
  }): Promise<{ docs: ITag[]; total: number }> {
    const query: Record<string, string> = {};

    if (params?.$page) query.$page = String(params.$page);
    if (params?.$limit) query.$limit = String(params.$limit);
    if (params?.search) query.search = params.search;

    const response = await this.get("/tags", query);
    return response.data.data;
  }

  async createTag(params: { name: string; color?: string }): Promise<ITag> {
    const response = await this.post("/tags", {}, {}, params);
    return response.data.data;
  }

  async updateTag(tagId: string, params: { name?: string; color?: string }): Promise<ITag> {
    const response = await this.patch(`/tags/${tagId}`, {}, {}, params);
    return response.data.data;
  }

  async deleteTag(tagId: string): Promise<void> {
    await this.delete(`/tags/${tagId}`, {}, {});
  }

  // ============================================================================
  // Asset Organization
  // ============================================================================

  async moveAssetToFolder(assetId: string, folderId: string | null): Promise<IAsset> {
    const response = await this.post(
      `/assets/${assetId}/move`,
      {},
      {},
      {
        folderId,
      }
    );
    return response.data.data;
  }

  async assignTagsToAsset(assetId: string, tagIds: string[]): Promise<IAsset> {
    await this.post(
      `/assets/${assetId}/tags`,
      {},
      {},
      {
        tagIds,
      }
    );
    // Get updated asset after assigning tags
    return this.getAsset(assetId);
  }

  async removeTagsFromAsset(assetId: string, tagIds: string[]): Promise<IAsset> {
    await this.delete(`/assets/${assetId}/tags`, { tagIds: tagIds.join(",") }, {});
    // Get updated asset after removing tags
    return this.getAsset(assetId);
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  async bulkDeleteAssets(
    assetIds: string[]
  ): Promise<{ successCount: number; failureCount: number; errors?: Array<{ assetId: string; error: string }> }> {
    const response = await this.post(
      "/assets/bulk",
      {},
      {},
      {
        action: "delete",
        assetIds,
      }
    );
    return response.data.data;
  }

  async bulkMoveAssets(
    assetIds: string[],
    folderId: string | null
  ): Promise<{ successCount: number; failureCount: number; errors?: Array<{ assetId: string; error: string }> }> {
    const response = await this.post(
      "/assets/bulk",
      {},
      {},
      {
        action: "move",
        assetIds,
        folderId,
      }
    );
    return response.data.data;
  }

  async bulkAssignTags(
    assetIds: string[],
    tagIds: string[]
  ): Promise<{ successCount: number; failureCount: number; errors?: Array<{ assetId: string; error: string }> }> {
    const response = await this.post(
      "/assets/bulk",
      {},
      {},
      {
        action: "assignTags",
        assetIds,
        tagIds,
      }
    );
    return response.data.data;
  }

  async bulkRemoveTags(
    assetIds: string[],
    tagIds: string[]
  ): Promise<{ successCount: number; failureCount: number; errors?: Array<{ assetId: string; error: string }> }> {
    const response = await this.post(
      "/assets/bulk",
      {},
      {},
      {
        action: "removeTags",
        assetIds,
        tagIds,
      }
    );
    return response.data.data;
  }

  // ============================================================================
  // Upload
  // ============================================================================

  async getUploadSignedUrl(params: {
    filename: string;
    contentType: string;
    size: number;
  }): Promise<{ url: string; path: string; expiresAt: string }> {
    const response = await this.post("/assets/upload", {}, {}, params);
    return response.data.data;
  }

  async completeUpload(params: { path: string; makePublic: boolean; folderId?: string | null }): Promise<IAsset> {
    const response = await this.post("/assets/upload/complete", {}, {}, params);
    return response.data.data;
  }

  async uploadAsset(file: File, options?: { folderId?: string | null; makePublic?: boolean }): Promise<IAsset> {
    // Get signed URL
    const { url, path } = await this.getUploadSignedUrl({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    });

    // Upload to signed URL
    await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    // Complete upload
    return this.completeUpload({
      path,
      makePublic: options?.makePublic ?? false,
      folderId: options?.folderId,
    });
  }
}
