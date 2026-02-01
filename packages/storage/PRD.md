# Storage Package PRD

## Overview

A multi-provider storage package for asset management supporting GCP, AWS S3, and other cloud providers. Provider selection via environment variables with override capability.

## Package Location

`packages/storage` → exports as `@buildbase/storage`

---

## Features

### Core Features

1. **Multi-Provider Support**
   - Google Cloud Storage (GCS)
   - AWS S3
   - Azure Blob Storage (future)
   - Local filesystem (dev mode)

2. **Provider Selection**
   - Environment variable: `STORAGE_PROVIDER=gcs|s3|azure|local`
   - Override via function parameter

3. **Operations**
   - Upload files (File/Buffer/Stream)
   - Delete files
   - Get signed URLs (read/write)
   - Get public URLs
   - List files
   - Make public/private
   - Get metadata

4. **Features**
   - Automatic content-type detection
   - File size validation
   - Allowed types filtering
   - Progress tracking
   - Resumable uploads (large files)

---

## API Design

### Types

```typescript
// Storage provider types
export type StorageProvider = "gcs" | "s3" | "azure" | "local";

// Upload options
export interface UploadOptions {
  path?: string; // Custom path
  contentType?: string; // Override content type
  metadata?: Record<string, string>; // Custom metadata
  makePublic?: boolean; // Make publicly accessible
  maxSize?: number; // Max file size in bytes
  allowedTypes?: string[]; // Allowed MIME types
  onProgress?: (percent: number) => void;
}

// Upload result
export interface UploadResult {
  id: string; // Unique identifier
  url: string; // Access URL (signed or public)
  path: string; // Storage path
  filename: string; // Original filename
  size: number; // File size in bytes
  contentType: string; // MIME type
  isPublic: boolean; // Public accessibility
  provider: StorageProvider; // Which provider was used
  bucket: string; // Bucket/container name
}

// Storage provider interface
export interface IStorageProvider {
  upload(file: File | Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresInMinutes?: number): Promise<string>;
  getPublicUrl(path: string): Promise<string | null>;
  makePublic(path: string): Promise<void>;
  makePrivate(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getMetadata(path: string): Promise<FileMetadata>;
  list(prefix: string): Promise<FileMetadata[]>;
}
```

### Usage

```typescript
import { StorageFactory, upload, getSignedUrl } from "@buildbase/storage";

// Using factory (recommended)
const storage = StorageFactory.getProvider(); // Uses env STORAGE_PROVIDER
const result = await storage.upload(file, { makePublic: true });

// Override provider
const gcsStorage = StorageFactory.getProvider("gcs");
const s3Storage = StorageFactory.getProvider("s3");

// Convenience functions
const result = await upload(file, { path: "uploads/image.png" });
const url = await getSignedUrl("uploads/image.png", 60);
```

---

## File Structure

```
packages/storage/
├── package.json
├── tsconfig.json
├── eslint.config.ts
├── vitest.config.ts
├── src/
│   ├── index.ts                    # Main exports
│   ├── types.ts                    # Type definitions
│   ├── factory.ts                  # StorageFactory
│   ├── config.ts                   # Configuration
│   ├── utils/
│   │   ├── content-type.ts         # MIME type detection
│   │   ├── validation.ts           # File validation
│   │   └── path.ts                 # Path utilities
│   ├── providers/
│   │   ├── base.provider.ts        # Base class
│   │   ├── gcs.provider.ts         # Google Cloud Storage
│   │   ├── s3.provider.ts          # AWS S3
│   │   └── local.provider.ts       # Local filesystem
│   └── __tests__/
│       ├── factory.test.ts
│       ├── gcs.test.ts
│       └── s3.test.ts
```

---

## Environment Variables

```bash
# Provider selection
STORAGE_PROVIDER=gcs  # gcs | s3 | azure | local

# Google Cloud Storage (uses standard Google Cloud environment variables)
GOOGLE_CLOUD_PROJECT=your-project
GCS_BUCKET_NAME=your-bucket
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=your-bucket

# Local (dev)
LOCAL_STORAGE_PATH=./uploads
```

---

## Implementation Phases

### Phase 1: Core Structure

- [ ] Create package scaffolding
- [ ] Define types and interfaces
- [ ] Implement StorageFactory
- [ ] Create base provider class

### Phase 2: GCS Provider

- [ ] Implement GoogleCloudStorageProvider
- [ ] Upload, delete, signed URLs
- [ ] Public/private toggle
- [ ] List and metadata

### Phase 3: S3 Provider

- [ ] Implement S3StorageProvider
- [ ] All operations matching GCS

### Phase 4: Local Provider

- [ ] Implement LocalStorageProvider
- [ ] For development without cloud

### Phase 5: Tests & Documentation

- [ ] Unit tests for each provider
- [ ] Integration tests
- [ ] README documentation
- [ ] Usage examples

---

## Dependencies

```json
{
  "@google-cloud/storage": "^7.x",
  "@aws-sdk/client-s3": "^3.x",
  "@aws-sdk/s3-request-presigner": "^3.x",
  "mime-types": "^2.x"
}
```

---

_PRD Version: 1.0_
_Created: 2026-01-29_
