import { v4 as uuid } from "uuid";
import mime from "mime-types";
import type {
  IStorageProvider,
  StorageProvider,
  UploadOptions,
  UploadResult,
  FileMetadata,
  SignedUrlOptions,
  ListOptions,
  ListResult,
  ValidationError,
} from "../types";

/**
 * Abstract base class for storage providers
 * Provides common functionality and validation
 */
export abstract class BaseStorageProvider implements IStorageProvider {
  abstract readonly type: StorageProvider;
  abstract readonly bucket: string;

  /**
   * Generate a unique file path
   */
  protected generatePath(filename: string, options: UploadOptions): string {
    if (options.path) {
      return options.path;
    }

    const randomString = uuid().replace(/-/g, "").substring(0, 12);
    const sanitizedFilename = this.sanitizeFilename(filename);

    if (options.organizationId) {
      return `${options.organizationId}/${randomString}-${sanitizedFilename}`;
    }

    if (options.userId) {
      return `users/${options.userId}/${randomString}-${sanitizedFilename}`;
    }

    return `uploads/${randomString}-${sanitizedFilename}`;
  }

  /**
   * Sanitize filename for storage
   */
  protected sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_")
      .toLowerCase();
  }

  /**
   * Detect content type from file or filename
   */
  protected detectContentType(file: File | Buffer, filename: string, providedType?: string): string {
    if (providedType) {
      return providedType;
    }

    if (file instanceof File) {
      return file.type || mime.lookup(filename) || "application/octet-stream";
    }

    return mime.lookup(filename) || "application/octet-stream";
  }

  /**
   * Get file size
   */
  protected getFileSize(file: File | Buffer): number {
    if (file instanceof File) {
      return file.size;
    }
    return file.length;
  }

  /**
   * Get filename from File or use default
   */
  protected getFilename(file: File | Buffer): string {
    if (file instanceof File) {
      return file.name;
    }
    return `file-${Date.now()}`;
  }

  /**
   * Validate upload options
   */
  protected validateUpload(file: File | Buffer, options: UploadOptions): void {
    const size = this.getFileSize(file);
    const filename = this.getFilename(file);
    const contentType = this.detectContentType(file, filename, options.contentType);

    // Check max size
    if (options.maxSize && size > options.maxSize) {
      throw new ValidationError(`File size ${size} exceeds maximum ${options.maxSize} bytes`, this.type);
    }

    // Check allowed types
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      if (!options.allowedTypes.includes(contentType)) {
        throw new ValidationError(
          `Content type ${contentType} is not allowed. Allowed: ${options.allowedTypes.join(", ")}`,
          this.type
        );
      }
    }
  }

  /**
   * Convert File to Buffer
   */
  protected async fileToBuffer(file: File | Buffer): Promise<Buffer> {
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    return file;
  }

  // Abstract methods to be implemented by providers
  abstract upload(file: File | Buffer, options: UploadOptions): Promise<UploadResult>;
  abstract delete(path: string): Promise<void>;
  abstract exists(path: string): Promise<boolean>;
  abstract getMetadata(path: string): Promise<FileMetadata>;
  abstract getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string>;
  abstract getPublicUrl(path: string): Promise<string | null>;
  abstract makePublic(path: string): Promise<void>;
  abstract makePrivate(path: string): Promise<void>;
  abstract list(options?: ListOptions): Promise<ListResult>;
  abstract copy(sourcePath: string, destinationPath: string): Promise<void>;
  abstract move(sourcePath: string, destinationPath: string): Promise<void>;
}

// Export ValidationError for use in validation
export { ValidationError } from "../types";
