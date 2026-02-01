# Media Library API Reference

## Overview

The Media Library API provides endpoints for managing assets, folders, and tags in both user and admin applications.

## Base URLs

- **User App**: `/api/assets`, `/api/folders`, `/api/tags`
- **Admin App**: `/api/assets`, `/api/folders`, `/api/tags`

## Authentication

- **User App**: Requires valid session via `getServerSession()`
- **Admin App**: Requires admin role via `withAuth()` middleware

## Assets API

### List Assets

**GET** `/api/assets`

**Query Parameters:**

- `$page` (number): Page number (default: 1)
- `$limit` (number): Items per page (default: 20, max: 100)
- `folderId` (string | null): Filter by folder
- `tagIds` (string): Comma-separated tag IDs
- `search` (string): Search query
- `contentType` (string): Comma-separated content types
- `isPublic` (boolean): Filter by public/private
- `sortBy` (string): Sort field (`name`, `size`, `createdAt`, `updatedAt`, `contentType`)
  - Note: `name` maps to `filename` in the database
- `sortOrder` (string): Sort order (`asc`, `desc`)

**Response:**

```json
{
  "docs": [...],
  "totalDocs": 100,
  "limit": 20,
  "page": 1,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### Get Asset

**GET** `/api/assets/[id]`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "...",
    "url": "...",
    "folder": {...},
    "tags": [...]
  }
}
```

### Update Asset

**PATCH** `/api/assets/[id]`

**Body:**

```json
{
  "folderId": "folder-id" | null,
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

### Delete Asset

**DELETE** `/api/assets/[id]`

### Bulk Operations

**POST** `/api/assets/bulk`

Performs bulk operations on multiple assets. Supports delete, move, assign tags, and remove tags actions.

**Body:**

```json
{
  "action": "delete" | "move" | "assignTags" | "removeTags",
  "assetIds": ["asset-id-1", "asset-id-2"],
  "folderId": "folder-id" | null,  // Required for "move" action
  "tagIds": ["tag-id-1"],  // Required for "assignTags" | "removeTags" actions
}
```

**Limits:**

- Maximum 100 assets per bulk operation
- Maximum 20 tags per asset

**Response:**

```json
{
  "success": true,
  "data": {
    "successCount": 2,
    "failureCount": 0,
    "errors": [
      {
        "assetId": "asset-id-3",
        "error": "Error message"
      }
    ]
  }
}
```

**Error Responses:**

- `400`: Invalid action, missing required fields, or validation error
- `401`: Unauthorized
- `500`: Server error

### Move Asset to Folder

**POST** `/api/assets/[id]/move`

Moves a single asset to a different folder.

**Body:**

```json
{
  "folderId": "folder-id" | null
}
```

### Assign Tags to Asset

**POST** `/api/assets/[id]/tags`

Assigns tags to a single asset.

**Body:**

```json
{
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

### Remove Tags from Asset

**DELETE** `/api/assets/[id]/tags`

Removes tags from a single asset.

**Body:**

```json
{
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

## Folders API

### List Folders

**GET** `/api/folders`

### Get Folder

**GET** `/api/folders/[id]`

### Create Folder

**POST** `/api/folders`

**Body:**

```json
{
  "name": "Folder Name",
  "parentFolderId": "parent-id" | null,
  "description": "Optional description"
}
```

### Update Folder

**PATCH** `/api/folders/[id]`

### Delete Folder

**DELETE** `/api/folders/[id]`

**Query Parameters:**

- `recursive` (boolean): Delete children recursively

### Move Folder

**POST** `/api/folders/[id]/move`

**Body:**

```json
{
  "targetParentFolderId": "parent-id" | null
}
```

### Get Folder Tree

**GET** `/api/folders/tree`

## Tags API

### List Tags

**GET** `/api/tags`

### Get Tag

**GET** `/api/tags/[id]`

### Create Tag

**POST** `/api/tags`

**Body:**

```json
{
  "name": "Tag Name",
  "color": "#FF0000"
}
```

### Update Tag

**PATCH** `/api/tags/[id]`

### Delete Tag

**DELETE** `/api/tags/[id]`

## Error Codes

- `FOLDER_NOT_FOUND`: Folder does not exist
- `TAG_NOT_FOUND`: Tag does not exist
- `ASSET_NOT_FOUND`: Asset does not exist
- `MAX_DEPTH_EXCEEDED`: Folder depth exceeds maximum (10 levels)
- `CIRCULAR_REFERENCE`: Cannot move folder into its own descendant
- `MAX_TAGS_EXCEEDED`: Asset exceeds maximum tags (20)
- `DUPLICATE_NAME`: Folder/tag name already exists in parent
- `MAX_BULK_OPERATION_SIZE`: Bulk operation exceeds maximum (100 assets)

## Limits and Constraints

- **Bulk Operations**: Maximum 100 assets per operation
- **Tags per Asset**: Maximum 20 tags per asset
- **Folder Depth**: Maximum 10 levels deep
- **Pagination**: Maximum 100 items per page
- **Search Debounce**: 300ms delay
