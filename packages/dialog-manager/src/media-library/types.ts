/**
 * Media Library Dialog Types
 *
 * These types define the props for media library dialogs.
 * Dialogs are "dumb" UI components that receive data and callbacks.
 */

import { DialogOrSheetBaseProps } from "../base-props";

// ============================================================================
// Common Types
// ============================================================================

export interface FolderTreeItem {
  id: string;
  name: string;
  children?: FolderTreeItem[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface FolderInfo {
  id: string;
  name: string;
  description?: string | null;
  path?: Array<{ id: string; name: string }>;
}

// ============================================================================
// Create Folder Dialog
// ============================================================================

export interface CreateFolderDialogProps extends DialogOrSheetBaseProps {
  /** Parent folder ID (null for root) - initial value, can be changed if folderTree is provided */
  parentFolderId?: string | null;
  /** Parent folder name (for display) - used when folderTree is not provided */
  parentFolderName?: string | null;
  /** Folder tree for parent selection (optional - if provided, allows selecting parent) */
  folderTree?: FolderTreeItem[];
  /** Loading state for folder tree */
  isLoadingTree?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Callback when folder is created */
  onCreateFolder: (data: { name: string; description?: string; parentFolderId?: string | null }) => Promise<void>;
}

// ============================================================================
// Edit Folder Dialog
// ============================================================================

export interface EditFolderDialogProps extends DialogOrSheetBaseProps {
  /** Folder ID to edit */
  folderId: string;
  /** Current folder name */
  currentName: string;
  /** Current folder description */
  currentDescription?: string | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when folder is updated */
  onUpdateFolder: (data: { name: string; description?: string }) => Promise<void>;
}

// ============================================================================
// Move Folder Dialog
// ============================================================================

export interface MoveFolderDialogProps extends DialogOrSheetBaseProps {
  /** Folder ID to move */
  folderId: string;
  /** Current folder name */
  folderName: string;
  /** Current parent folder ID */
  currentParentFolderId?: string | null;
  /** Folder tree for selection (excluding the folder being moved) */
  folderTree: FolderTreeItem[];
  /** Loading state for folder tree */
  isLoadingTree?: boolean;
  /** Loading state for move action */
  isLoading?: boolean;
  /** Callback when folder is moved */
  onMoveFolder: (targetParentFolderId: string | null) => Promise<void>;
}

// ============================================================================
// Create Tag Dialog
// ============================================================================

export interface CreateTagDialogProps extends DialogOrSheetBaseProps {
  /** Loading state */
  isLoading?: boolean;
  /** Callback when tag is created */
  onCreateTag: (data: { name: string; color?: string }) => Promise<void>;
}

// ============================================================================
// Edit Tag Dialog
// ============================================================================

export interface EditTagDialogProps extends DialogOrSheetBaseProps {
  /** Tag ID to edit */
  tagId: string;
  /** Current tag name */
  currentName: string;
  /** Current tag color */
  currentColor?: string | null;
  /** Loading state */
  isLoading?: boolean;
  /** Callback when tag is updated */
  onUpdateTag: (data: { name: string; color?: string }) => Promise<void>;
}

// ============================================================================
// Assign Tags Dialog
// ============================================================================

export interface AssignTagsDialogProps extends DialogOrSheetBaseProps {
  /** Asset ID */
  assetId: string;
  /** Current tags assigned to asset */
  currentTags: Tag[];
  /** All available tags */
  allTags: Tag[];
  /** Loading state for tags list */
  isLoadingTags?: boolean;
  /** Error loading tags */
  tagsError?: string | null;
  /** Retry loading tags */
  onRetryLoadTags?: () => void;
  /** Loading state for save action */
  isLoading?: boolean;
  /** Callback when tags are updated */
  onSaveTags: (tagIds: string[]) => Promise<void>;
}

// ============================================================================
// Move Asset Dialog
// ============================================================================

export interface MoveAssetDialogProps extends DialogOrSheetBaseProps {
  /** Asset ID */
  assetId: string;
  /** Asset name (for display) */
  assetName: string;
  /** Current folder ID (null if in root) */
  currentFolderId?: string | null;
  /** Current folder path (for display) */
  currentFolderPath?: string | null;
  /** Folder tree for selection */
  folderTree: FolderTreeItem[];
  /** Loading state for folder tree */
  isLoadingTree?: boolean;
  /** Loading state for move action */
  isLoading?: boolean;
  /** Callback when asset is moved */
  onMoveAsset: (targetFolderId: string | null) => Promise<void>;
}

// ============================================================================
// Media Upload Dialog
// ============================================================================

export interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  result?: {
    id: string;
    url: string;
    path: string;
  };
}

export interface MediaUploadDialogProps extends DialogOrSheetBaseProps {
  /** Current folder ID to upload to */
  folderId?: string | null;
  /** Current folder name (for display) */
  folderName?: string | null;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Accepted file types (e.g., "image/*,video/*") */
  acceptedTypes?: string;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Files being uploaded */
  files?: UploadedFile[];
  /** Callback when files are selected */
  onFilesSelected?: (files: File[]) => void;
  /** Callback when upload starts */
  onUpload: (files: File[]) => Promise<void>;
  /** Callback when a file is removed */
  onRemoveFile?: (fileId: string) => void;
  /** Callback when upload is complete */
  onComplete?: () => void;
}

// ============================================================================
// Delete Folder Confirmation
// ============================================================================

export interface DeleteFolderDialogProps extends DialogOrSheetBaseProps {
  /** Folder ID to delete */
  folderId: string;
  /** Folder name */
  folderName: string;
  /** Number of assets in folder */
  assetCount?: number;
  /** Number of subfolders */
  subfolderCount?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Callback when folder is deleted */
  onDeleteFolder: (recursive: boolean) => Promise<void>;
}

// ============================================================================
// Delete Asset Confirmation
// ============================================================================

export interface DeleteAssetDialogProps extends DialogOrSheetBaseProps {
  /** Asset ID to delete */
  assetId: string;
  /** Asset name */
  assetName: string;
  /** Asset thumbnail URL */
  thumbnailUrl?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Callback when asset is deleted */
  onDeleteAsset: () => Promise<void>;
}
