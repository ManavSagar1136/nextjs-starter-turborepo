import { Storage, Bucket } from "@google-cloud/storage";
import { v4 as uuid } from "uuid";
import { BaseStorageProvider } from "./base.provider";
import { getGcsConfig } from "../config";
import type {
  StorageProvider,
  UploadOptions,
  UploadResult,
  FileMetadata,
  SignedUrlOptions,
  ListOptions,
  ListResult,
} from "../types";
import { FileNotFoundError, UploadError } from "../types";

/**
 * Google Cloud Storage provider implementation
 */
export class GcsStorageProvider extends BaseStorageProvider {
  readonly type: StorageProvider = "gcs";
  readonly bucket: string;

  private storage: Storage;
  private bucketInstance: Bucket;

  constructor() {
    super();
    const config = getGcsConfig();

    this.bucket = config.bucket;

    // Initialize Storage with credentials (matching the example pattern)
    this.storage = new Storage({
      projectId: config.projectId,
      credentials: config.credentials,
    });

    this.bucketInstance = this.storage.bucket(this.bucket);
  }

  async upload(file: File | Buffer, options: UploadOptions = {}): Promise<UploadResult> {
    this.validateUpload(file, options);

    const filename = this.getFilename(file);
    const path = this.generatePath(filename, options);
    const contentType = this.detectContentType(file, filename, options.contentType);
    const buffer = await this.fileToBuffer(file);
    const size = buffer.length;

    try {
      const blob = this.bucketInstance.file(path);
      const stream = blob.createWriteStream({
        metadata: {
          contentType,
          metadata: {
            ...options.metadata,
            ...(options.organizationId && { organizationId: options.organizationId }),
            ...(options.userId && { userId: options.userId }),
          },
        },
        resumable: size > 5 * 1024 * 1024, // Resumable for files > 5MB
      });

      await new Promise<void>((resolve, reject) => {
        stream.on("error", reject);
        stream.on("finish", resolve);
        stream.end(buffer);
      });

      let url: string;
      if (options.makePublic) {
        await blob.makePublic();
        url = `https://storage.googleapis.com/${this.bucket}/${path}`;
      } else {
        [url] = await blob.getSignedUrl({
          action: "read",
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });
      }

      return {
        id: uuid(),
        url,
        path,
        filename,
        size,
        contentType,
        isPublic: options.makePublic || false,
        provider: this.type,
        bucket: this.bucket,
      };
    } catch (error) {
      throw new UploadError(
        `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
        this.type,
        error instanceof Error ? error : undefined
      );
    }
  }

  async delete(path: string): Promise<void> {
    const file = this.bucketInstance.file(path);
    await file.delete();
  }

  async exists(path: string): Promise<boolean> {
    const file = this.bucketInstance.file(path);
    const [exists] = await file.exists();
    return exists;
  }

  async getMetadata(path: string): Promise<FileMetadata> {
    const file = this.bucketInstance.file(path);
    const [exists] = await file.exists();

    if (!exists) {
      throw new FileNotFoundError(path, this.type);
    }

    const [metadata] = await file.getMetadata();

    return {
      path,
      name: path.split("/").pop() || path,
      size: parseInt(String(metadata.size || "0"), 10),
      contentType: metadata.contentType || "application/octet-stream",
      updatedAt: metadata.updated || new Date().toISOString(),
      createdAt: metadata.timeCreated,
      metadata: metadata.metadata as Record<string, string> | undefined,
    };
  }

  async getSignedUrl(path: string, options: SignedUrlOptions = {}): Promise<string> {
    const file = this.bucketInstance.file(path);
    const expiresInMinutes = options.expiresInMinutes || 60;
    const action = options.action || "read";

    const signOptions: {
      version: "v4";
      action: "read" | "write";
      expires: number;
      contentType?: string;
    } = {
      version: "v4",
      action,
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    };

    if (options.contentType) {
      signOptions.contentType = options.contentType;
    }

    const [url] = await file.getSignedUrl(signOptions);
    return url;
  }

  async getPublicUrl(path: string): Promise<string | null> {
    const file = this.bucketInstance.file(path);
    const [exists] = await file.exists();

    if (!exists) {
      return null;
    }

    // Check if file is public
    try {
      const [metadata] = await file.getMetadata();
      const isPublic = (metadata.acl as Array<{ entity: string; role: string }> | undefined)?.some(
        entry => entry.entity === "allUsers" && entry.role === "READER"
      );

      if (isPublic) {
        return `https://storage.googleapis.com/${this.bucket}/${path}`;
      }
    } catch {
      // If we can't check ACL, assume not public
    }

    return null;
  }

  async makePublic(path: string): Promise<void> {
    const file = this.bucketInstance.file(path);
    await file.makePublic();
  }

  async makePrivate(path: string): Promise<void> {
    const file = this.bucketInstance.file(path);
    await file.makePrivate({ strict: true });
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const [files, , apiResponse] = await this.bucketInstance.getFiles({
      prefix: options.prefix,
      maxResults: options.maxResults,
      pageToken: options.pageToken,
    });

    return {
      files: files.map(file => ({
        path: file.name,
        name: file.name.split("/").pop() || file.name,
        size: parseInt(String(file.metadata.size || "0"), 10),
        contentType: file.metadata.contentType || "application/octet-stream",
        updatedAt: file.metadata.updated || new Date().toISOString(),
        createdAt: file.metadata.timeCreated,
      })),
      nextPageToken: (apiResponse as { nextPageToken?: string })?.nextPageToken,
    };
  }

  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    const sourceFile = this.bucketInstance.file(sourcePath);
    const destFile = this.bucketInstance.file(destinationPath);
    await sourceFile.copy(destFile);
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    await this.copy(sourcePath, destinationPath);
    await this.delete(sourcePath);
  }
}
