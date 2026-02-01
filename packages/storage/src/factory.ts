import type { IStorageProvider, StorageProvider } from "./types";
import { getStorageProvider, validateConfig } from "./config";

/**
 * Factory for creating storage provider instances
 * Implements singleton pattern for each provider type
 */
export class StorageFactory {
  private static instance: StorageFactory;
  private providers: Map<StorageProvider, IStorageProvider>;
  private providerLoaders: Map<StorageProvider, () => Promise<IStorageProvider>>;

  private constructor() {
    this.providers = new Map();
    this.providerLoaders = new Map();
    this.registerDefaultLoaders();
  }

  /**
   * Get the singleton factory instance
   */
  public static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  /**
   * Register default provider loaders
   * Uses dynamic imports for code splitting
   */
  private registerDefaultLoaders(): void {
    this.providerLoaders.set("gcs", async () => {
      const { GcsStorageProvider } = await import("./providers/gcs.provider");
      return new GcsStorageProvider();
    });

    this.providerLoaders.set("s3", async () => {
      const { S3StorageProvider } = await import("./providers/s3.provider");
      return new S3StorageProvider();
    });

    this.providerLoaders.set("local", async () => {
      const { LocalStorageProvider } = await import("./providers/local.provider");
      return new LocalStorageProvider();
    });
  }

  /**
   * Register a custom provider loader
   */
  public registerProvider(type: StorageProvider, loader: () => Promise<IStorageProvider>): void {
    this.providerLoaders.set(type, loader);
  }

  /**
   * Get a storage provider instance
   * @param type - Override provider type (uses env if not provided)
   */
  public async getProvider(type?: StorageProvider): Promise<IStorageProvider> {
    const providerType = type || getStorageProvider();

    // Return cached instance if available
    if (this.providers.has(providerType)) {
      return this.providers.get(providerType)!;
    }

    // Validate configuration
    validateConfig(providerType);

    // Get loader for provider
    const loader = this.providerLoaders.get(providerType);
    if (!loader) {
      throw new Error(`No loader registered for provider: ${providerType}`);
    }

    // Load and cache provider
    const provider = await loader();
    this.providers.set(providerType, provider);

    return provider;
  }

  /**
   * Clear cached provider instances
   * Useful for testing or configuration changes
   */
  public clearCache(): void {
    this.providers.clear();
  }

  /**
   * Get the default provider type from environment
   */
  public getDefaultProviderType(): StorageProvider {
    return getStorageProvider();
  }
}

/**
 * Get the default storage provider
 * Convenience function for quick access
 */
export async function getStorage(type?: StorageProvider): Promise<IStorageProvider> {
  return StorageFactory.getInstance().getProvider(type);
}

/**
 * Upload a file using the default provider
 * Convenience function for common operations
 */
export async function upload(file: File | Buffer, options: Parameters<IStorageProvider["upload"]>[1] = {}) {
  const storage = await getStorage();
  return storage.upload(file, options);
}

/**
 * Delete a file using the default provider
 */
export async function deleteFile(path: string) {
  const storage = await getStorage();
  return storage.delete(path);
}

/**
 * Get a signed URL using the default provider
 */
export async function getSignedUrl(path: string, options?: Parameters<IStorageProvider["getSignedUrl"]>[1]) {
  const storage = await getStorage();
  return storage.getSignedUrl(path, options);
}

/**
 * Get the public URL for a file
 */
export async function getPublicUrl(path: string) {
  const storage = await getStorage();
  return storage.getPublicUrl(path);
}
