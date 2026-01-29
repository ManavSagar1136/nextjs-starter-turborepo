/**
 * Media Library Dialogs
 *
 * Reusable dialog components for media library features:
 * - Folder management (create, edit, move)
 * - Tag management (create, edit, assign)
 * - Asset management (move, upload)
 *
 * These dialogs are "dumb" UI components that receive data and callbacks,
 * making them reusable across different apps with different state management.
 */

// Types
export * from "./types";

// Dialog Components
export { CreateFolderDialog } from "./CreateFolderDialog";
export { EditFolderDialog } from "./EditFolderDialog";
export { MoveFolderDialog } from "./MoveFolderDialog";
export { CreateTagDialog } from "./CreateTagDialog";
export { EditTagDialog } from "./EditTagDialog";
export { AssignTagsDialog } from "./AssignTagsDialog";
export { MoveAssetDialog } from "./MoveAssetDialog";
export { MediaUploadDialog } from "./MediaUploadDialog";
export { AssetPreviewDialog, type AssetPreviewDialogProps } from "./AssetPreviewDialog";

// Shared Components
export { FolderTreeSelect } from "./FolderTreeSelect";

/**
 * Media Library Dialog Keys
 *
 * Use these when registering dialogs with the dialog manager.
 */
export const MEDIA_LIBRARY_DIALOG_KEYS = {
  CREATE_FOLDER: "media-library:create-folder",
  EDIT_FOLDER: "media-library:edit-folder",
  MOVE_FOLDER: "media-library:move-folder",
  CREATE_TAG: "media-library:create-tag",
  EDIT_TAG: "media-library:edit-tag",
  ASSIGN_TAGS: "media-library:assign-tags",
  MOVE_ASSET: "media-library:move-asset",
  MEDIA_UPLOAD: "media-library:upload",
  ASSET_PREVIEW: "media-library:asset-preview",
} as const;

export type MediaLibraryDialogKey = (typeof MEDIA_LIBRARY_DIALOG_KEYS)[keyof typeof MEDIA_LIBRARY_DIALOG_KEYS];
