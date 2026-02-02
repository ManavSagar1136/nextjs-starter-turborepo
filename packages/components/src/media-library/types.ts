/**
 * Media Library Types
 *
 * These types are used throughout the media library components.
 * They are designed to be generic and work with any backend implementation.
 */

export interface ITag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface IFolder {
  id: string;
  name: string;
  description?: string | null;
  parentFolderId?: string | null;
  parent?: { id: string; name: string } | null;
  path?: Array<{ id: string; name: string }>;
  children?: IFolder[];
  _count?: {
    assets?: number;
    children?: number;
  };
}

export interface IFolderTreeItem {
  id: string;
  name: string;
  parentFolderId?: string | null;
  children?: IFolderTreeItem[];
  _count?: {
    assets?: number;
    children?: number;
  };
}

export interface IAsset {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  filename?: string;
  contentType?: string;
  size?: number;
  isPublic?: boolean;
  width?: number;
  height?: number;
  folder?: {
    id: string;
    name: string;
    path?: Array<{ id: string; name: string }>;
  } | null;
  tags?: ITag[];
  metadata?: Record<string, unknown>;
}

export interface IPaginationResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IAssetListParams {
  folderId?: string | null;
  folderPath?: string;
  tagIds?: string[];
  tagSlugs?: string[];
  search?: string;
  contentType?: string | string[];
  isPublic?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  $page?: number;
  $limit?: number;
}

export interface IFolderListParams {
  parentFolderId?: string | null;
  search?: string;
  $page?: number;
  $limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Asset Actions - centralized action types for asset operations
 */
export const ASSET_ACTIONS = {
  DELETE: "delete",
  ASSIGN_TAGS: "assign_tags",
  MOVE: "move",
  TOGGLE_PRIVACY: "toggle_privacy",
  TAG_TOGGLE: "tag_toggle",
  COPY_URL: "copy_url",
  PREVIEW: "preview",
  DOWNLOAD: "download",
  EDIT: "edit",
  EDIT_METADATA: "edit_metadata",
  DUPLICATE: "duplicate",
} as const;

export type IAssetAction = (typeof ASSET_ACTIONS)[keyof typeof ASSET_ACTIONS];

export interface IAssetActionPayload {
  action: IAssetAction;
  asset: IAsset;
  tag?: ITag;
}

/**
 * Media Library API interface - implement this to connect to your backend
 */
export interface IMediaLibraryApi {
  // Assets
  getAssets: (params?: IAssetListParams) => Promise<IPaginationResponse<IAsset>>;
  getAsset: (assetId: string) => Promise<IAsset>;
  updateAsset: (
    assetId: string,
    params: {
      filename?: string;
      folderId?: string | null;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ) => Promise<IAsset>;
  deleteAsset: (assetId: string, force?: boolean) => Promise<void>;
  toggleAssetPrivacy: (assetId: string, makePublic: boolean) => Promise<IAsset>;
  duplicateAsset: (assetId: string) => Promise<IAsset>;
  getAssetDownloadUrl: (assetId: string) => Promise<{
    url: string;
    filename: string;
    expiresAt: string;
  }>;

  // Folders
  getFolderTree: () => Promise<IFolderTreeItem[]>;
  getFolders: (params?: IFolderListParams) => Promise<IPaginationResponse<IFolder>>;
  getFolder: (folderId: string) => Promise<IFolder>;
  createFolder: (params: { name: string; parentFolderId?: string | null; description?: string }) => Promise<IFolder>;
  updateFolder: (folderId: string, params: { name?: string; description?: string }) => Promise<IFolder>;
  deleteFolder: (folderId: string, recursive?: boolean) => Promise<void>;
  moveFolder: (folderId: string, targetParentFolderId: string | null) => Promise<IFolder>;

  // Tags
  getTags: (params?: { search?: string; $page?: number; $limit?: number }) => Promise<{
    docs: ITag[];
    total: number;
  }>;
  createTag: (params: { name: string; color?: string }) => Promise<ITag>;
  updateTag: (tagId: string, params: { name?: string; color?: string }) => Promise<ITag>;
  deleteTag: (tagId: string) => Promise<void>;

  // Asset organization
  moveAssetToFolder: (assetId: string, folderId: string | null) => Promise<IAsset>;
  assignTagsToAsset: (assetId: string, tagIds: string[]) => Promise<IAsset>;
  removeTagsFromAsset: (assetId: string, tagIds: string[]) => Promise<IAsset>;

  // Bulk operations
  bulkDeleteAssets?: (
    assetIds: string[]
  ) => Promise<{ successCount: number; failureCount: number; errors?: Array<{ assetId: string; error: string }> }>;
  bulkMoveAssets?: (
    assetIds: string[],
    folderId: string | null
  ) => Promise<{ successCount: number; failureCount: number; errors?: Array<{ assetId: string; error: string }> }>;
  bulkAssignTags?: (
    assetIds: string[],
    tagIds: string[]
  ) => Promise<{ successCount: number; failureCount: number; errors?: Array<{ assetId: string; error: string }> }>;
  bulkRemoveTags?: (
    assetIds: string[],
    tagIds: string[]
  ) => Promise<{ successCount: number; failureCount: number; errors?: Array<{ assetId: string; error: string }> }>;

  // Upload
  uploadAsset?: (file: File, options?: { folderId?: string | null; makePublic?: boolean }) => Promise<IAsset>;
  getUploadSignedUrl?: (params: { filename: string; contentType: string; size: number }) => Promise<{
    url: string;
    path: string;
    expiresAt: string;
  }>;
  completeUpload?: (params: { path: string; makePublic: boolean }) => Promise<IAsset>;
}

/**
 * View modes for the asset grid
 */
export type ViewMode = "grid" | "list";

/**
 * Media Library labels configuration
 */
export interface IMediaLibraryLabels {
  title: string;
  uploadButton: string;
  newFolderButton: string;
  allAssets: string;
  noAssets: string;
  noFolders: string;
}

/**
 * Media Library configuration
 */
export interface IMediaLibraryConfig {
  /** Enable folder organization feature */
  enableFolders?: boolean;
  /** Enable tag organization feature */
  enableTags?: boolean;
  /** Enable file upload */
  enableUpload?: boolean;
  /** Enable public/private toggle */
  enablePrivacyToggle?: boolean;
  /** Default view mode */
  defaultViewMode?: ViewMode;
  /** Page size for pagination */
  pageSize?: number;
  /** Maximum file size for upload (in bytes) */
  maxFileSize?: number;
  /** Allowed MIME types for upload */
  allowedMimeTypes?: string[];
  /** Custom labels */
  labels?: Partial<IMediaLibraryLabels>;
}

/**
 * Fully resolved configuration (all fields required)
 */
export interface IResolvedMediaLibraryConfig {
  enableFolders: boolean;
  enableTags: boolean;
  enableUpload: boolean;
  enablePrivacyToggle: boolean;
  defaultViewMode: ViewMode;
  pageSize: number;
  maxFileSize: number;
  allowedMimeTypes: string[];
  labels: IMediaLibraryLabels;
}

/**
 * Default configuration
 */
export const DEFAULT_MEDIA_LIBRARY_CONFIG: IResolvedMediaLibraryConfig = {
  enableFolders: true,
  enableTags: true,
  enableUpload: true,
  enablePrivacyToggle: true,
  defaultViewMode: "grid",
  pageSize: 20,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [],
  labels: {
    title: "Media Library",
    uploadButton: "Upload",
    newFolderButton: "New Folder",
    allAssets: "All Assets",
    noAssets: "No assets found",
    noFolders: "No folders yet",
  },
};
