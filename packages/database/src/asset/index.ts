// Export all asset service functions
export { listAssets } from "./list-assets";
export { getAssetById } from "./get-asset";
export { updateAsset } from "./update-asset";
export { deleteAsset } from "./delete-asset";

// Export bulk operations
export { bulkDeleteAssets, bulkMoveAssets, bulkAssignTags, bulkRemoveTags } from "./bulk-operations";
export type { BulkOperationResult, BulkOperationError } from "./bulk-operations";

// Export types
export type { ListAssetsOptions, PaginatedAssets, AssetWithDetails, UpdateAssetInput } from "./types";

// Export only MAX_TAGS_PER_ASSET (unique to assets)
// DEFAULT_PAGE_SIZE and MAX_PAGE_SIZE are not exported to avoid conflicts
export { MAX_TAGS_PER_ASSET } from "./constants";
