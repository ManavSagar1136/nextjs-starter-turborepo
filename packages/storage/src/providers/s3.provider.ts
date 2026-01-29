import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  PutObjectAclCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { BaseStorageProvider } from "./base.provider";
import { getS3Config } from "../config";
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
 * AWS S3 storage provider implementation
 */
export class S3StorageProvider extends BaseStorageProvider {
  readonly type: StorageProvider = "s3";
  readonly bucket: string;

  private client: S3Client;
  private region: string;

  constructor() {
    super();
    const config = getS3Config();

    this.bucket = config.bucket;
    this.region = config.region;

    this.client = new S3Client({
      region: config.region,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    });
  }

  async upload(file: File | Buffer, options: UploadOptions = {}): Promise<UploadResult> {
    this.validateUpload(file, options);

    const filename = this.getFilename(file);
    const path = this.generatePath(filename, options);
    const contentType = this.detectContentType(file, filename, options.contentType);
    const buffer = await this.fileToBuffer(file);
    const size = buffer.length;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          ...options.metadata,
          ...(options.organizationId && { organizationId: options.organizationId }),
          ...(options.userId && { userId: options.userId }),
        },
        ACL: options.makePublic ? "public-read" : "private",
      });

      await this.client.send(command);

      let url: string;
      if (options.makePublic) {
        url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
      } else {
        url = await this.getSignedUrl(path, { expiresInMinutes: 60 });
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
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });
    await this.client.send(command);
  }

  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      if ((error as { name?: string }).name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(path: string): Promise<FileMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      const response = await this.client.send(command);

      return {
        path,
        name: path.split("/").pop() || path,
        size: response.ContentLength || 0,
        contentType: response.ContentType || "application/octet-stream",
        updatedAt: response.LastModified?.toISOString() || new Date().toISOString(),
        metadata: response.Metadata,
      };
    } catch (error) {
      if ((error as { name?: string }).name === "NotFound") {
        throw new FileNotFoundError(path, this.type);
      }
      throw error;
    }
  }

  async getSignedUrl(path: string, options: SignedUrlOptions = {}): Promise<string> {
    const expiresInMinutes = options.expiresInMinutes || 60;
    const action = options.action || "read";

    const command =
      action === "write"
        ? new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            ContentType: options.contentType,
          })
        : new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
          });

    return awsGetSignedUrl(this.client, command, {
      expiresIn: expiresInMinutes * 60,
    });
  }

  async getPublicUrl(path: string): Promise<string | null> {
    // For S3, we can't easily check if a file is public without ACL access
    // We'll return the public URL format, but it may not work if file isn't public
    const exists = await this.exists(path);
    if (!exists) {
      return null;
    }

    // Return the public URL format
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
  }

  async makePublic(path: string): Promise<void> {
    const command = new PutObjectAclCommand({
      Bucket: this.bucket,
      Key: path,
      ACL: "public-read",
    });
    await this.client.send(command);
  }

  async makePrivate(path: string): Promise<void> {
    const command = new PutObjectAclCommand({
      Bucket: this.bucket,
      Key: path,
      ACL: "private",
    });
    await this.client.send(command);
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: options.prefix,
      MaxKeys: options.maxResults,
      ContinuationToken: options.pageToken,
    });

    const response = await this.client.send(command);

    return {
      files: (response.Contents || []).map(item => ({
        path: item.Key || "",
        name: (item.Key || "").split("/").pop() || item.Key || "",
        size: item.Size || 0,
        contentType: "application/octet-stream", // S3 doesn't return content type in list
        updatedAt: item.LastModified?.toISOString() || new Date().toISOString(),
      })),
      nextPageToken: response.NextContinuationToken,
    };
  }

  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourcePath}`,
      Key: destinationPath,
    });
    await this.client.send(command);
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    await this.copy(sourcePath, destinationPath);
    await this.delete(sourcePath);
  }
}
