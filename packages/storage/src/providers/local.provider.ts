import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuid } from "uuid";
import { BaseStorageProvider } from "./base.provider";
import { getLocalConfig } from "../config";
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
 * Local filesystem storage provider for development
 */
export class LocalStorageProvider extends BaseStorageProvider {
  readonly type: StorageProvider = "local";
  readonly bucket: string;

  private basePath: string;
  private baseUrl: string;

  constructor() {
    super();
    const config = getLocalConfig();

    this.basePath = config.basePath;
    this.baseUrl = config.baseUrl || "/uploads";
    this.bucket = "local";
  }

  private getFullPath(filePath: string): string {
    return path.join(this.basePath, filePath);
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async upload(file: File | Buffer, options: UploadOptions = {}): Promise<UploadResult> {
    this.validateUpload(file, options);

    const filename = this.getFilename(file);
    const filePath = this.generatePath(filename, options);
    const contentType = this.detectContentType(file, filename, options.contentType);
    const buffer = await this.fileToBuffer(file);
    const size = buffer.length;

    try {
      const fullPath = this.getFullPath(filePath);
      const dirPath = path.dirname(fullPath);

      await this.ensureDir(dirPath);
      await fs.writeFile(fullPath, buffer);

      // Store metadata in a sidecar file
      const metadataPath = `${fullPath}.meta.json`;
      await fs.writeFile(
        metadataPath,
        JSON.stringify({
          contentType,
          size,
          isPublic: options.makePublic || false,
          metadata: options.metadata,
          organizationId: options.organizationId,
          userId: options.userId,
          createdAt: new Date().toISOString(),
        })
      );

      const url = `${this.baseUrl}/${filePath}`;

      return {
        id: uuid(),
        url,
        path: filePath,
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

  async delete(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    const metadataPath = `${fullPath}.meta.json`;

    await fs.unlink(fullPath);

    // Also delete metadata file if exists
    try {
      await fs.unlink(metadataPath);
    } catch {
      // Ignore if metadata file doesn't exist
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(filePath: string): Promise<FileMetadata> {
    const fullPath = this.getFullPath(filePath);
    const metadataPath = `${fullPath}.meta.json`;

    try {
      const stat = await fs.stat(fullPath);

      // Try to read metadata file
      let metadata: Record<string, unknown> = {};
      try {
        const metaContent = await fs.readFile(metadataPath, "utf-8");
        metadata = JSON.parse(metaContent);
      } catch {
        // No metadata file
      }

      return {
        path: filePath,
        name: path.basename(filePath),
        size: stat.size,
        contentType: (metadata.contentType as string) || "application/octet-stream",
        updatedAt: stat.mtime.toISOString(),
        createdAt: stat.birthtime.toISOString(),
        isPublic: (metadata.isPublic as boolean) || false,
        metadata: metadata.metadata as Record<string, string> | undefined,
      };
    } catch {
      throw new FileNotFoundError(filePath, this.type);
    }
  }

  async getSignedUrl(filePath: string, _options: SignedUrlOptions = {}): Promise<string> {
    // Local storage doesn't support signed URLs
    // Just return the regular URL
    return `${this.baseUrl}/${filePath}`;
  }

  async getPublicUrl(filePath: string): Promise<string | null> {
    const exists = await this.exists(filePath);
    if (!exists) {
      return null;
    }
    return `${this.baseUrl}/${filePath}`;
  }

  async makePublic(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    const metadataPath = `${fullPath}.meta.json`;

    try {
      const metaContent = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(metaContent);
      metadata.isPublic = true;
      await fs.writeFile(metadataPath, JSON.stringify(metadata));
    } catch {
      // Create new metadata file
      await fs.writeFile(metadataPath, JSON.stringify({ isPublic: true }));
    }
  }

  async makePrivate(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    const metadataPath = `${fullPath}.meta.json`;

    try {
      const metaContent = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(metaContent);
      metadata.isPublic = false;
      await fs.writeFile(metadataPath, JSON.stringify(metadata));
    } catch {
      // Create new metadata file
      await fs.writeFile(metadataPath, JSON.stringify({ isPublic: false }));
    }
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const prefix = options.prefix || "";
    const searchPath = this.getFullPath(prefix);

    const files: FileMetadata[] = [];

    const readDir = async (dirPath: string, relativePath: string = ""): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name.endsWith(".meta.json")) {
            continue; // Skip metadata files
          }

          const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

          if (entry.isDirectory()) {
            await readDir(path.join(dirPath, entry.name), entryRelativePath);
          } else {
            const filePath = prefix ? `${prefix}/${entryRelativePath}` : entryRelativePath;
            try {
              const metadata = await this.getMetadata(filePath);
              files.push(metadata);
            } catch {
              // Skip files we can't read
            }
          }
        }
      } catch {
        // Directory doesn't exist
      }
    };

    await readDir(searchPath);

    // Apply maxResults
    const limitedFiles = options.maxResults ? files.slice(0, options.maxResults) : files;

    return {
      files: limitedFiles,
      nextPageToken: undefined, // Local storage doesn't support pagination
    };
  }

  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    const sourceFullPath = this.getFullPath(sourcePath);
    const destFullPath = this.getFullPath(destinationPath);
    const destDir = path.dirname(destFullPath);

    await this.ensureDir(destDir);
    await fs.copyFile(sourceFullPath, destFullPath);

    // Also copy metadata file if exists
    const sourceMetaPath = `${sourceFullPath}.meta.json`;
    const destMetaPath = `${destFullPath}.meta.json`;

    try {
      await fs.copyFile(sourceMetaPath, destMetaPath);
    } catch {
      // No metadata file
    }
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    await this.copy(sourcePath, destinationPath);
    await this.delete(sourcePath);
  }
}
