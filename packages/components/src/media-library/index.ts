/**
 * Media Library Components
 *
 * A comprehensive media library UI component package for managing assets,
 * folders, and tags. Designed to be used with any backend implementation
 * via the IMediaLibraryApi interface.
 *
 * @example Basic Usage
 * ```tsx
 * import {
 *   MediaLibrary,
 *   MediaLibraryProvider,
 *   type IMediaLibraryApi,
 * } from "@buildbase/components/media-library";
 *
 * // Implement your API
 * const api: IMediaLibraryApi = {
 *   getAssets: async (params) => { ... },
 *   // ... other methods
 * };
 *
 * function App() {
 *   const { data: assets } = useQuery(...);
 *   const { data: folders } = useQuery(...);
 *   const { data: tags } = useQuery(...);
 *
 *   return (
 *     <MediaLibraryProvider
 *       api={api}
 *       assets={assets}
 *       folderTree={folders}
 *       tags={tags}
 *     >
 *       <MediaLibrary
 *         onUpload={() => setUploadDialogOpen(true)}
 *         onCreateFolder={() => setCreateFolderDialogOpen(true)}
 *       />
 *     </MediaLibraryProvider>
 *   );
 * }
 * ```
 */

// Types
export * from "./types";

// Context and hooks
export { MediaLibraryProvider, useMediaLibrary, useAssetQueryParams } from "./context";

// Components
export { MediaLibrary, MinimalMediaLibrary } from "./MediaLibrary";
export { AssetGrid } from "./AssetGrid";
export { AssetCard, AssetListItem } from "./AssetCard";
export { FolderTree, FolderSidebar } from "./FolderTree";
export { SearchAndFilters } from "./SearchAndFilters";
export { BreadcrumbNav } from "./BreadcrumbNav";
export { BulkActionsBar } from "./BulkActionsBar";

// Utilities
export * from "./utils";

// Hooks
export { useErrorRecovery } from "./hooks/useErrorRecovery";
export { useOfflineDetection, useOfflineQueue } from "./hooks/useOfflineDetection";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
export { useVirtualScrolling } from "./hooks/useVirtualScrolling";
