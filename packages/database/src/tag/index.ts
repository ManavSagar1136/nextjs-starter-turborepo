// Export all tag service functions
export { createTag } from "./create-tag";
export { updateTag } from "./update-tag";
export { deleteTag } from "./delete-tag";
export { getTagById } from "./get-tag";
export { listTags } from "./list-tags";
export { verifyTagOwnership } from "./verify-tag-ownership";

// Export types
export type { CreateTagInput, UpdateTagInput, ListTagsOptions, PaginatedTags, TagWithDetails } from "./types";

// Constants are not exported to avoid conflicts - import directly from "./constants" if needed
