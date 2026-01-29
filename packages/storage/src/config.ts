import type { StorageConfig, StorageProvider } from "./types";

/**
 * Get storage provider from environment
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || "gcs";
  const validProviders: StorageProvider[] = ["gcs", "s3", "azure", "local"];

  if (!validProviders.includes(provider as StorageProvider)) {
    throw new Error(`Invalid STORAGE_PROVIDER: ${provider}. Must be one of: ${validProviders.join(", ")}`);
  }

  return provider as StorageProvider;
}

/**
 * Get GCS configuration from environment
 */
export function getGcsConfig() {
  return {
    projectId: process.env.GCS_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "",
    bucket: process.env.GCS_BUCKET_NAME || "",
    keyFilename: process.env.GCS_KEY_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS,
  };
}

/**
 * Get S3 configuration from environment
 */
export function getS3Config() {
  return {
    region: process.env.AWS_REGION || "us-east-1",
    bucket: process.env.S3_BUCKET_NAME || "",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

/**
 * Get local storage configuration from environment
 */
export function getLocalConfig() {
  return {
    basePath: process.env.LOCAL_STORAGE_PATH || "./uploads",
    baseUrl: process.env.LOCAL_STORAGE_URL || "/uploads",
  };
}

/**
 * Get full storage configuration from environment
 */
export function getStorageConfig(): StorageConfig {
  return {
    provider: getStorageProvider(),
    gcs: getGcsConfig(),
    s3: getS3Config(),
    local: getLocalConfig(),
  };
}

/**
 * Validate configuration for a specific provider
 */
export function validateConfig(provider: StorageProvider): void {
  switch (provider) {
    case "gcs": {
      const config = getGcsConfig();
      if (!config.bucket) {
        throw new Error("GCS_BUCKET_NAME is required for GCS provider");
      }
      break;
    }
    case "s3": {
      const config = getS3Config();
      if (!config.bucket) {
        throw new Error("S3_BUCKET_NAME is required for S3 provider");
      }
      break;
    }
    case "local": {
      // Local doesn't require validation
      break;
    }
    case "azure": {
      throw new Error("Azure provider is not yet implemented");
    }
  }
}
