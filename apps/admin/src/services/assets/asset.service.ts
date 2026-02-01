import { BaseApiController } from "../base";

export interface Asset {
  id: string;
  name: string;
  filename: string;
  url: string;
  path: string;
  size: number;
  contentType: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  folder?: {
    id: string;
    name: string;
  } | null;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
    color: string | null;
  }>;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  workspace?: {
    id: string;
    name: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAssets {
  docs: Asset[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ListAssetsOptions {
  page?: number;
  limit?: number;
  workspaceId?: string;
  folderId?: string | null;
  tagIds?: string[];
  search?: string;
  contentType?: string[];
  isPublic?: boolean;
}

export class AssetApis extends BaseApiController {
  protected urlPath: string = "/assets";

  /**
   * List assets with pagination and filters
   * @param options - Query options
   */
  async list(options?: ListAssetsOptions): Promise<PaginatedAssets> {
    const params: Record<string, string> = {};

    if (options?.page) params["$page"] = options.page.toString();
    if (options?.limit) params["$limit"] = options.limit.toString();
    if (options?.workspaceId) params["workspaceId"] = options.workspaceId;
    if (options?.folderId !== undefined) params["folderId"] = options.folderId === null ? "null" : options.folderId;
    if (options?.tagIds && options.tagIds.length > 0) params["tagIds"] = options.tagIds.join(",");
    if (options?.search) params["search"] = options.search;
    if (options?.contentType && options.contentType.length > 0) params["contentType"] = options.contentType.join(",");
    if (options?.isPublic !== undefined) params["isPublic"] = options.isPublic.toString();

    return (await this.get(this.urlPath, params)).data;
  }

  /**
   * Get a single asset by ID
   * @param id - Asset ID
   */
  async getById(id: string): Promise<Asset> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data.data;
  }

  /**
   * Delete an asset
   * @param id - Asset ID
   */
  async remove(id: string): Promise<{ success: boolean; message?: string }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }
}
