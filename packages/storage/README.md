# @buildbase/storage

Multi-provider cloud storage package with support for Google Cloud Storage, AWS S3, and local filesystem.

## Features

- 🔄 **Multi-provider** — GCS, S3, and Local filesystem support
- 🏭 **Factory pattern** — Singleton instances with automatic provider selection
- 🔐 **Signed URLs** — Generate secure, time-limited URLs for uploads/downloads
- 📁 **File operations** — Upload, delete, copy, move, list
- 🔒 **Access control** — Make files public/private
- ✅ **Type-safe** — Full TypeScript support

## Installation

```bash
# Already included in monorepo
yarn add @buildbase/storage
```

## Quick Start

```typescript
import { getStorage, upload, getSignedUrl } from "@buildbase/storage";

// Upload a file
const result = await upload(file, {
  path: "uploads/image.png",
  makePublic: true,
});

console.log(result.url); // Public URL

// Get a signed URL for private files
const signedUrl = await getSignedUrl("uploads/private.pdf", {
  expiresInMinutes: 60,
});
```

## Configuration

Set environment variables in `.env`:

```bash
# Provider selection (gcs | s3 | local)
STORAGE_PROVIDER=gcs

# Google Cloud Storage
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
# Optional: Path to service account key file
GCS_KEY_FILE=/path/to/service-account.json
# Or use default credentials
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# Local Storage (development)
LOCAL_STORAGE_PATH=./uploads
LOCAL_STORAGE_URL=/uploads
```

## API Reference

### Factory Functions

```typescript
import {
  getStorage,
  upload,
  deleteFile,
  getSignedUrl,
  getPublicUrl,
} from "@buildbase/storage";

// Get storage instance (uses STORAGE_PROVIDER env var)
const storage = await getStorage();

// Override provider
const gcsStorage = await getStorage("gcs");
const s3Storage = await getStorage("s3");
const localStorage = await getStorage("local");

// Convenience functions (use default provider)
await upload(file, options);
await deleteFile(path);
await getSignedUrl(path, options);
await getPublicUrl(path);
```

### Upload Options

```typescript
interface UploadOptions {
  path?: string; // Custom path (auto-generated if not provided)
  prefix?: string; // Path prefix (e.g., "uploads/")
  contentType?: string; // MIME type (auto-detected if not provided)
  makePublic?: boolean; // Make file publicly accessible
  metadata?: Record<string, string>; // Custom metadata
}

const result = await storage.upload(file, {
  path: "images/avatar.png",
  makePublic: true,
  metadata: {
    uploadedBy: "user123",
  },
});

// Result
interface UploadResult {
  path: string; // Storage path
  url: string; // Access URL (signed or public)
  size: number; // File size in bytes
  contentType: string; // MIME type
}
```

### Signed URLs

```typescript
interface SignedUrlOptions {
  expiresInMinutes?: number; // Default: 60
  action?: "read" | "write"; // Default: "read"
  contentType?: string; // Required for "write" action
}

// Download URL (read)
const downloadUrl = await storage.getSignedUrl("path/to/file.pdf", {
  expiresInMinutes: 30,
});

// Upload URL (write) - for direct browser uploads
const uploadUrl = await storage.getSignedUrl("uploads/new-file.pdf", {
  action: "write",
  contentType: "application/pdf",
  expiresInMinutes: 15,
});
```

### File Operations

```typescript
// Delete a file
await storage.delete("path/to/file.png");

// Copy a file
await storage.copy("source/file.png", "destination/file.png");

// Move a file
await storage.move("old/path.png", "new/path.png");

// List files
const result = await storage.list({
  prefix: "uploads/",
  maxResults: 100,
  pageToken: "next-page-token",
});

// result.files: FileMetadata[]
// result.nextPageToken?: string
```

### Access Control

```typescript
// Make a file public
await storage.makePublic("path/to/file.png");

// Make a file private
await storage.makePrivate("path/to/file.png");

// Get public URL (only works for public files)
const publicUrl = await storage.getPublicUrl("path/to/file.png");
```

## Provider-Specific Notes

### Google Cloud Storage

- Requires `@google-cloud/storage` package
- Uses Application Default Credentials or service account key
- Supports resumable uploads for large files (>5MB)

### AWS S3

- Requires `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- Uses AWS credentials from environment or IAM role
- Supports multipart uploads

### Local Storage

- Stores files on local filesystem
- Metadata stored in `.meta.json` sidecar files
- Perfect for development and testing
- Signed URLs use base64-encoded expiry (not cryptographically secure)

## Usage with @buildbase/database

Combine storage with the database assets module:

```typescript
import { getStorage } from "@buildbase/storage";
import { AssetsRepository } from "@buildbase/database/assets";

// Upload file to storage
const storage = await getStorage();
const result = await storage.upload(file, { makePublic: true });

// Track in database
await AssetsRepository.create({
  filename: file.name,
  path: result.path,
  url: result.url,
  size: result.size,
  contentType: result.contentType,
  bucket: storage.bucket,
  isPublic: true,
  workspaceId: "workspace123",
  userId: "user456",
});
```

## Error Handling

```typescript
import {
  StorageError,
  FileNotFoundError,
  UploadError,
  ValidationError,
} from "@buildbase/storage";

try {
  await storage.delete("non-existent-file.png");
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.log("File not found:", error.path);
  } else if (error instanceof StorageError) {
    console.log("Storage error:", error.message);
  }
}
```

## Testing

```bash
# Run unit tests
yarn test

# Run with coverage
yarn test --coverage
```

## License

MIT
