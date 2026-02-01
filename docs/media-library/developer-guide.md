# Media Library Developer Guide

## Architecture Overview

The media library is built with a layered architecture:

1. **API Layer** (`apps/*/src/app/api/`)
   - Next.js API routes
   - Authentication and authorization
   - Request/response handling

2. **Service Layer** (`packages/database/src/asset/`, `packages/database/src/folder/`, `packages/database/src/tag/`)
   - Business logic
   - Validation
   - Database operations

3. **UI Components** (`packages/components/src/media-library/`)
   - Reusable React components
   - Context-based state management
   - Dialog integration

4. **Hooks** (`apps/*/src/hooks/use-media-library.ts`)
   - React Query integration
   - Optimistic updates
   - Cache management

## Service Layer Patterns

### Folder Service

```typescript
import {
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderTree,
} from "@buildbase/database";

// Create folder
const folder = await createFolder({
  name: "My Folder",
  parentFolderId: null,
  workspaceId: "workspace-id",
  userId: "user-id",
});

// Update folder
await updateFolder("folder-id", {
  name: "Updated Name",
});

// Delete folder (recursive)
await deleteFolder("folder-id", { recursive: true });
```

### Tag Service

```typescript
import { createTag, updateTag, deleteTag } from "@buildbase/database";

// Create tag
const tag = await createTag({
  name: "My Tag",
  workspaceId: "workspace-id",
  userId: "user-id",
});

// Update tag
await updateTag("tag-id", {
  name: "Updated Tag",
  color: "#FF0000",
});
```

### Asset Service

```typescript
import {
  listAssets,
  updateAsset,
  bulkDeleteAssets,
  bulkMoveAssets,
} from "@buildbase/database";

// List assets with filters
const assets = await listAssets({
  workspaceId: "workspace-id",
  folderId: "folder-id",
  tagIds: ["tag-1", "tag-2"],
  search: "query",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: 20,
});

// Bulk operations
const deleteResult = await bulkDeleteAssets(
  ["asset-1", "asset-2"],
  "workspace-id"
);
const moveResult = await bulkMoveAssets(
  ["asset-1", "asset-2"],
  "folder-id",
  "workspace-id"
);
const tagResult = await bulkAssignTags(
  ["asset-1"],
  ["tag-1", "tag-2"],
  "workspace-id"
);
const removeTagResult = await bulkRemoveTags(
  ["asset-1"],
  ["tag-1"],
  "workspace-id"
);
```

## Component Usage

### MediaLibrary Component

```typescript
import { MediaLibrary, MediaLibraryProvider } from "@buildbase/components/media-library";
import { API } from "@/services";

function AssetsPage() {
  const { data: assets } = useAssets();
  const { data: folders } = useFolderTree();
  const { data: tags } = useTags();

  return (
    <MediaLibraryProvider
      api={API.mediaLibrary}
      assets={assets}
      folderTree={folders}
      tags={tags}
    >
      <MediaLibrary
        onUpload={() => {}}
        onCreateFolder={() => {}}
        onBulkDelete={(ids) => {}}
        onBulkMove={(ids) => {}}
        onBulkAssignTags={(ids) => {}}
      />
    </MediaLibraryProvider>
  );
}
```

## Adding New Features

1. **Add Service Function**
   - Create function in `packages/database/src/asset/` (or folder/tag)
   - Add validation
   - Export from `index.ts`

2. **Add API Endpoint**
   - Create route in `apps/*/src/app/api/`
   - Use service function
   - Handle errors

3. **Add Service Method**
   - Update `MediaLibraryService` class
   - Add method to `IMediaLibraryApi` interface

4. **Add React Hook**
   - Create hook in `apps/*/src/hooks/use-media-library.ts`
   - Use React Query
   - Handle cache invalidation

5. **Add UI Component**
   - Create component in `packages/components/src/media-library/`
   - Use context for state
   - Integrate with dialogs

## Testing

Run tests:

```bash
# Run all media library tests
yarn test packages/database/src/asset/__tests__/

# Run specific test file
yarn test packages/database/src/asset/__tests__/bulk-operations.test.ts
```

## Performance Considerations

- **Search Debouncing**: Search queries are debounced by 300ms to reduce API calls
- **Pagination**: Default page size is 20, max is 100
- **Bulk Operations**: Limited to 100 assets per operation to prevent timeouts
- **Lazy Loading**: Images use lazy loading for better performance
- **Cache Management**: React Query handles caching and invalidation automatically

## Accessibility

The media library includes:

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader announcements
- Proper semantic HTML structure
- Focus management for dialogs

## Constants

Key constants are defined in:

- `packages/database/src/asset/constants.ts`
- `packages/database/src/folder/constants.ts`
- `packages/database/src/tag/constants.ts`

### Asset Constants

- `MAX_TAGS_PER_ASSET`: 20
- `DEFAULT_PAGE_SIZE`: 20
- `MAX_PAGE_SIZE`: 100
- `MAX_BULK_OPERATION_SIZE`: 100 (defined in `bulk-operations.ts`)

### Folder Constants

- `MAX_FOLDER_DEPTH`: 10
- `MIN_FOLDER_NAME_LENGTH`: 1
- `MAX_FOLDER_NAME_LENGTH`: 255
- `FOLDER_NAME_PATTERN`: `/^[a-zA-Z0-9\s\-_]+$/`

### Tag Constants

- `MIN_TAG_NAME_LENGTH`: 1
- `MAX_TAG_NAME_LENGTH`: 50
- `TAG_NAME_PATTERN`: `/^[a-zA-Z0-9\s\-_]+$/`

### UI Constants

- `SEARCH_DEBOUNCE_DELAY`: 300ms (defined in `context.tsx`)
