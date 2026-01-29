/**
 * Supported storage providers
 */
export type StorageProvider = "gcs" | "s3" | "azure" | "local";

/**
 * Options for uploading files
 */
export interface UploadOptions {
  /** Custom storage path (default: auto-generated) */
  path?: string;
  /** Override content type detection */
  contentType?: string;
  /** Custom metadata to attach to the file */
  metadata?: Record<string, string>;
  /** Make the file publicly accessible */
  makePublic?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Progress callback (0-100) */
  onProgress?: (percent: number) => void;
  /** Organization ID for multi-tenant systems */
  organizationId?: string;
  /** User ID for tracking ownership */
  userId?: string;
}

/**
 * Result of an upload operation
 */
export interface UploadResult {
  /** Unique identifier for the upload */
  id: string;
  /** Access URL (signed or public) */
  url: string;
  /** Storage path */
  path: string;
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  contentType: string;
  /** Whether the file is publicly accessible */
  isPublic: boolean;
  /** Which provider was used */
  provider: StorageProvider;
  /** Bucket/container name */
  bucket: string;
}

/**
 * File metadata
 */
export interface FileMetadata {
  /** Storage path */
  path: string;
  /** Original filename */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  contentType: string;
  /** Last modified date */
  updatedAt: string;
  /** Creation date */
  createdAt?: string;
  /** Whether the file is publicly accessible */
  isPublic?: boolean;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Options for getting signed URLs
 */
export interface SignedUrlOptions {
  /** Expiration time in minutes (default: 60) */
  expiresInMinutes?: number;
  /** Action type for the URL */
  action?: "read" | "write";
  /** Content type (required for write actions) */
  contentType?: string;
}

/**
 * Options for listing files
 */
export interface ListOptions {
  /** Prefix to filter files */
  prefix?: string;
  /** Maximum number of files to return */
  maxResults?: number;
  /** Pagination token */
  pageToken?: string;
}

/**
 * Result of a list operation
 */
export interface ListResult {
  /** List of files */
  files: FileMetadata[];
  /** Token for next page (if more results exist) */
  nextPageToken?: string;
}

/**
 * Storage provider interface
 * All providers must implement this interface
 */
export interface IStorageProvider {
  /** Provider type */
  readonly type: StorageProvider;

  /** Bucket/container name */
  readonly bucket: string;

  /**
   * Upload a file to storage
   */
  upload(file: File | Buffer, options: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a file from storage
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getMetadata(path: string): Promise<FileMetadata>;

  /**
   * Get a signed URL for temporary access
   */
  getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Get the public URL for a file (if publicly accessible)
   * Returns null if file is not public
   */
  getPublicUrl(path: string): Promise<string | null>;

  /**
   * Make a file publicly accessible
   */
  makePublic(path: string): Promise<void>;

  /**
   * Make a file private
   */
  makePrivate(path: string): Promise<void>;

  /**
   * List files with optional prefix filter
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Copy a file to a new location
   */
  copy(sourcePath: string, destinationPath: string): Promise<void>;

  /**
   * Move a file to a new location
   */
  move(sourcePath: string, destinationPath: string): Promise<void>;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Default provider */
  provider: StorageProvider;
  /** GCS configuration */
  gcs?: {
    projectId: string;
    bucket: string;
    keyFilename?: string;
  };
  /** S3 configuration */
  s3?: {
    region: string;
    bucket: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  /** Local storage configuration */
  local?: {
    basePath: string;
    baseUrl?: string;
  };
}

/**
 * Error types for storage operations
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider: StorageProvider,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export class FileNotFoundError extends StorageError {
  constructor(path: string, provider: StorageProvider) {
    super(`File not found: ${path}`, "FILE_NOT_FOUND", provider);
    this.name = "FileNotFoundError";
  }
}

export class UploadError extends StorageError {
  constructor(message: string, provider: StorageProvider, cause?: Error) {
    super(message, "UPLOAD_ERROR", provider, cause);
    this.name = "UploadError";
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, provider: StorageProvider) {
    super(message, "VALIDATION_ERROR", provider);
    this.name = "ValidationError";
  }
}
