/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CacheVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface VersionedCacheKey {
  version: string;
  key: string;
  originalKey: string;
}

export class CacheVersioning {
  private static readonly CURRENT_VERSION = "1.0.0";
  private static readonly VERSION_SEPARATOR = ":v:";

  /**
   * Create a versioned cache key
   */
  static createVersionedKey(key: string, version?: string): string {
    const cacheVersion = version || this.CURRENT_VERSION;
    return `${key}${this.VERSION_SEPARATOR}${cacheVersion}`;
  }

  /**
   * Extract version from cache key
   */
  static extractVersion(key: string): VersionedCacheKey | null {
    const versionIndex = key.lastIndexOf(this.VERSION_SEPARATOR);
    if (versionIndex === -1) {
      return null;
    }

    const originalKey = key.substring(0, versionIndex);
    const version = key.substring(versionIndex + this.VERSION_SEPARATOR.length);

    return {
      version,
      key,
      originalKey,
    };
  }

  /**
   * Check if cache key needs migration
   */
  static needsMigration(key: string): boolean {
    const versioned = this.extractVersion(key);
    if (!versioned) {
      return true; // No version, needs migration
    }

    return versioned.version !== this.CURRENT_VERSION;
  }

  /**
   * Migrate cache key to current version
   */
  static migrateKey(key: string): string {
    const versioned = this.extractVersion(key);
    if (!versioned) {
      return this.createVersionedKey(key);
    }

    return this.createVersionedKey(versioned.originalKey);
  }

  /**
   * Get current cache version
   */
  static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }

  /**
   * Compare versions
   */
  static compareVersions(v1: string, v2: string): number {
    const parseVersion = (version: string): CacheVersion => {
      const parts = version.split(".").map(Number);
      const major = parts[0] ?? 0;
      const minor = parts[1] ?? 0;
      const patch = parts[2] ?? 0;
      return { major, minor, patch };
    };

    const version1 = parseVersion(v1);
    const version2 = parseVersion(v2);

    if (version1.major !== version2.major) {
      return version1.major - version2.major;
    }
    if (version1.minor !== version2.minor) {
      return version1.minor - version2.minor;
    }
    return version1.patch - version2.patch;
  }

  /**
   * Check if version is compatible
   */
  static isCompatible(version: string): boolean {
    const current = parseFloat(this.CURRENT_VERSION);
    const check = parseFloat(version);

    // Allow same major version
    return Math.floor(current) === Math.floor(check);
  }
}

/**
 * Versioned cache key generators (edge-compatible)
 */
const encodeBase64 = (str: string): string => {
  if (typeof btoa !== "undefined") {
    return btoa(str);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  throw new Error("No base64 encoding available");
};

export const versionedCacheKeys = {
  static: (path: string, params?: Record<string, any>) => {
    const baseKey = `static:${path}`;
    if (params) {
      const paramString = JSON.stringify(params);
      return CacheVersioning.createVersionedKey(`${baseKey}:${encodeBase64(paramString)}`);
    }
    return CacheVersioning.createVersionedKey(baseKey);
  },

  dynamic: (resource: string, id: string, params?: Record<string, any>) => {
    const baseKey = `dynamic:${resource}:${id}`;
    if (params) {
      const paramString = JSON.stringify(params);
      return CacheVersioning.createVersionedKey(`${baseKey}:${encodeBase64(paramString)}`);
    }
    return CacheVersioning.createVersionedKey(baseKey);
  },

  user: (userId: string, resource: string, params?: Record<string, any>) => {
    const baseKey = `user:${userId}:${resource}`;
    if (params) {
      const paramString = JSON.stringify(params);
      return CacheVersioning.createVersionedKey(`${baseKey}:${encodeBase64(paramString)}`);
    }
    return CacheVersioning.createVersionedKey(baseKey);
  },

  api: (endpoint: string, params?: Record<string, any>) => {
    const baseKey = `api:${endpoint}`;
    if (params) {
      const paramString = JSON.stringify(params);
      return CacheVersioning.createVersionedKey(`${baseKey}:${encodeBase64(paramString)}`);
    }
    return CacheVersioning.createVersionedKey(baseKey);
  },
};
