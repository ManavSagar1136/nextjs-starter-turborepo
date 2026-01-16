/* eslint-disable @typescript-eslint/no-explicit-any */
import { LRUCache } from "lru-cache";

import type { Logger } from "./types";
import { noOpLogger } from "./types";

export interface FallbackCacheOptions {
  max?: number;
  ttl?: number;
  updateAgeOnGet?: boolean;
  logger?: Logger;
}

export interface FallbackCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  strategy?: string;
  compressed?: boolean;
}

export class FallbackCache {
  private cache: LRUCache<string, FallbackCacheEntry>;
  private logger: Logger;

  constructor(options: FallbackCacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 500,
      ttl: options.ttl || 1000 * 60 * 5, // 5 minutes
      updateAgeOnGet: options.updateAgeOnGet || true,
    });
    this.logger = options.logger || noOpLogger;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const entry: FallbackCacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl || 300,
      };
      this.cache.set(key, entry, { ttl: ttl ? ttl * 1000 : undefined });
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache set error:",
        data: { key, value, ttl },
        error,
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key) as FallbackCacheEntry;
      if (!entry) return null;

      // Check if expired
      const now = Date.now();
      const expiryTime = entry.timestamp + entry.ttl * 1000;
      if (now > expiryTime) {
        this.cache.delete(key);
        return null;
      }

      return entry.data as T;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache get error:",
        error,
      });
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.cache.delete(key);
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache delete error:",
        error,
      });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = this.cache.keys();
      let deletedCount = 0;

      for (const key of keys) {
        if (pattern === "*") {
          this.cache.delete(key);
          deletedCount++;
        } else if (pattern.endsWith("*")) {
          const prefix = pattern.slice(0, -1);
          if (key.startsWith(prefix)) {
            this.cache.delete(key);
            deletedCount++;
          }
        } else if (pattern.includes("*")) {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          if (regex.test(key)) {
            this.cache.delete(key);
            deletedCount++;
          }
        } else {
          if (key === pattern) {
            this.cache.delete(key);
            deletedCount++;
          }
        }
      }

      this.logger.info({
        tag: "CACHE",
        msg: `Fallback cache: Deleted ${deletedCount} keys matching pattern "${pattern}"`,
      });
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache delete pattern error:",
        error,
      });
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache clear error:",
        error,
      });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const entry = this.cache.get(key) as FallbackCacheEntry;
      if (!entry) return false;

      const now = Date.now();
      const expiryTime = entry.timestamp + entry.ttl * 1000;
      if (now > expiryTime) {
        this.cache.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache exists error:",
        error,
      });
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      return await Promise.all(keys.map(key => this.get<T>(key)));
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache mget error:",
        error,
      });
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      await Promise.all(keyValuePairs.map(({ key, value, ttl }) => this.set(key, value, ttl)));
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache mset error:",
        error,
      });
    }
  }

  async incr(key: string, amount: number = 1): Promise<number> {
    try {
      const current = (await this.get<number>(key)) || 0;
      const newValue = current + amount;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache incr error:",
        error,
      });
      return 0;
    }
  }

  async decr(key: string, amount: number = 1): Promise<number> {
    try {
      const current = (await this.get<number>(key)) || 0;
      const newValue = current - amount;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache decr error:",
        error,
      });
      return 0;
    }
  }

  async setnx<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const exists = await this.exists(key);
      if (!exists) {
        await this.set(key, value, ttl);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache setnx error:",
        error,
      });
      return false;
    }
  }

  async setxx<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const exists = await this.exists(key);
      if (exists) {
        await this.set(key, value, ttl);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache setxx error:",
        error,
      });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const entry = this.cache.get(key) as FallbackCacheEntry;
      if (!entry) return -2;

      const now = Date.now();
      const expiryTime = entry.timestamp + entry.ttl * 1000;
      const remaining = Math.ceil((expiryTime - now) / 1000);

      if (remaining <= 0) {
        this.cache.delete(key);
        return -2;
      }

      return remaining;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache ttl error:",
        error,
      });
      return -2;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const entry = this.cache.get(key) as FallbackCacheEntry;
      if (!entry) return false;

      entry.ttl = ttl;
      entry.timestamp = Date.now();
      this.cache.set(key, entry, { ttl: ttl * 1000 });
      return true;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache expire error:",
        error,
      });
      return false;
    }
  }

  async persist(key: string): Promise<boolean> {
    try {
      const entry = this.cache.get(key) as FallbackCacheEntry;
      if (!entry) return false;

      entry.ttl = 0;
      this.cache.set(key, entry);
      return true;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache persist error:",
        error,
      });
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const allKeys = Array.from(this.cache.keys()) as string[];
      if (pattern === "*") return allKeys;

      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache keys error:",
        error,
      });
      return [];
    }
  }

  async type(key: string): Promise<string> {
    try {
      const value = await this.get(key);
      if (value === null) return "none";
      if (typeof value === "string") return "string";
      if (typeof value === "number") return "string";
      if (Array.isArray(value)) return "list";
      if (typeof value === "object") return "hash";
      return "string";
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache type error:",
        error,
      });
      return "none";
    }
  }

  async strlen(key: string): Promise<number> {
    try {
      const value = await this.get<string>(key);
      if (value === null) return 0;
      return String(value).length;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache strlen error:",
        error,
      });
      return 0;
    }
  }

  async append(key: string, value: string): Promise<number> {
    try {
      const current = (await this.get<string>(key)) || "";
      const newValue = current + value;
      await this.set(key, newValue);
      return newValue.length;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache append error:",
        error,
      });
      return 0;
    }
  }

  async getrange(key: string, start: number, end: number): Promise<string> {
    try {
      const value = await this.get<string>(key);
      if (value === null) return "";

      const str = String(value);
      const length = str.length;
      const startPos = start < 0 ? Math.max(0, length + start) : Math.min(start, length);
      const endPos = end < 0 ? Math.max(0, length + end + 1) : Math.min(end + 1, length);

      return str.substring(startPos, endPos);
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache getrange error:",
        error,
      });
      return "";
    }
  }

  async setrange(key: string, offset: number, value: string): Promise<number> {
    try {
      const current = (await this.get<string>(key)) || "";
      const str = String(current);
      const newStr = str.padEnd(offset) + value;
      await this.set(key, newStr);
      return newStr.length;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache setrange error:",
        error,
      });
      return 0;
    }
  }

  async getdel<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get<T>(key);
      await this.delete(key);
      return value;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache getdel error:",
        error,
      });
      return null;
    }
  }

  async getset<T>(key: string, value: T, ttl?: number): Promise<T | null> {
    try {
      const oldValue = await this.get<T>(key);
      await this.set(key, value, ttl);
      return oldValue;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache getset error:",
        error,
      });
      return null;
    }
  }

  async existsMultiple(keys: string[]): Promise<number> {
    try {
      const results = await Promise.all(keys.map(key => this.exists(key)));
      return results.filter(Boolean).length;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache existsMultiple error:",
        error,
      });
      return 0;
    }
  }

  async del(...keys: string[]): Promise<number> {
    try {
      let deleted = 0;
      for (const key of keys) {
        const existed = await this.exists(key);
        if (existed) {
          await this.delete(key);
          deleted++;
        }
      }
      return deleted;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache del error:",
        error,
      });
      return 0;
    }
  }

  async rename(oldKey: string, newKey: string): Promise<boolean> {
    try {
      const value = await this.get(oldKey);
      if (value === null) return false;

      await this.set(newKey, value);
      await this.delete(oldKey);
      return true;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache rename error:",
        error,
      });
      return false;
    }
  }

  async renamenx(oldKey: string, newKey: string): Promise<boolean> {
    try {
      const value = await this.get(oldKey);
      if (value === null) return false;

      const newKeyExists = await this.exists(newKey);
      if (newKeyExists) return false;

      await this.set(newKey, value);
      await this.delete(oldKey);
      return true;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache renamenx error:",
        error,
      });
      return false;
    }
  }

  async randomkey(): Promise<string | null> {
    try {
      const keys = Array.from(this.cache.keys()) as string[];
      if (keys.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * keys.length);
      return keys[randomIndex] || null;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache randomkey error:",
        error,
      });
      return null;
    }
  }

  async dbsize(): Promise<number> {
    try {
      return this.cache.size;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache dbsize error:",
        error,
      });
      return 0;
    }
  }

  async flushdb(): Promise<boolean> {
    try {
      this.cache.clear();
      return true;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache flushdb error:",
        error,
      });
      return false;
    }
  }

  async flushall(): Promise<boolean> {
    try {
      this.cache.clear();
      return true;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache flushall error:",
        error,
      });
      return false;
    }
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  async getServerInfo(): Promise<string> {
    return "Fallback Cache (LRU) - In Memory";
  }

  async getMemoryUsage(): Promise<any> {
    try {
      return {
        used_memory: this.cache.size * 100,
        used_memory_human: `${this.cache.size * 100} bytes`,
        maxmemory: this.cache.max * 100,
        maxmemory_human: `${this.cache.max * 100} bytes`,
      };
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache getMemoryUsage error:",
        error,
      });
      return {};
    }
  }

  async getSlowLog(): Promise<any[]> {
    return [];
  }

  async getClientList(): Promise<any[]> {
    return [];
  }

  async getConfig(): Promise<any> {
    try {
      return {
        maxmemory: this.cache.max,
        ttl: this.cache.ttl,
        updateAgeOnGet: this.cache.updateAgeOnGet,
      };
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache getConfig error:",
        error,
      });
      return {};
    }
  }

  async setConfig(_parameter: string, _value: string): Promise<boolean> {
    this.logger.warn({
      tag: "CACHE",
      msg: `Fallback cache setConfig: ${_parameter} = ${_value} (not implemented)`,
    });
    return true;
  }

  async resetConfigStats(): Promise<boolean> {
    return true;
  }

  async time(): Promise<[number, number]> {
    try {
      const now = Date.now();
      const seconds = Math.floor(now / 1000);
      const microseconds = Math.floor((now % 1000) * 1000);
      return [seconds, microseconds];
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache time error:",
        error,
      });
      return [0, 0];
    }
  }

  async echo(message: string): Promise<string> {
    return message;
  }

  async select(db: number): Promise<boolean> {
    this.logger.warn({
      tag: "CACHE",
      msg: `Fallback cache select: database ${db} (not supported)`,
    });
    return db === 0;
  }

  async move(_key: string, _db: number): Promise<boolean> {
    this.logger.warn({
      tag: "CACHE",
      msg: `Fallback cache move: key ${_key} to database ${_db} (not supported)`,
    });
    return false;
  }

  async copy(source: string, destination: string): Promise<boolean> {
    try {
      const value = await this.get(source);
      if (value === null) return false;

      await this.set(destination, value);
      return true;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache copy error:",
        error,
      });
      return false;
    }
  }

  async sort(key: string, options?: any): Promise<any[]> {
    try {
      const value = await this.get(key);
      if (value === null || !Array.isArray(value)) return [];

      const sorted = [...value];

      if (options?.alpha) {
        sorted.sort((a, b) => String(a).localeCompare(String(b)));
      } else {
        sorted.sort((a, b) => {
          const numA = Number(a);
          const numB = Number(b);
          return isNaN(numA) || isNaN(numB) ? 0 : numA - numB;
        });
      }

      if (options?.desc) {
        sorted.reverse();
      }

      return sorted;
    } catch (error) {
      this.logger.error({
        tag: "CACHE",
        msg: "Fallback cache sort error:",
        error,
      });
      return [];
    }
  }

  async wait(_numreplicas: number, _timeout: number): Promise<number> {
    this.logger.warn({
      tag: "CACHE",
      msg: `Fallback cache wait: replicas ${_numreplicas}, timeout ${_timeout} (not supported)`,
    });
    return 0;
  }

  async lastsave(): Promise<number> {
    return Math.floor(Date.now() / 1000);
  }

  async save(): Promise<boolean> {
    this.logger.warn({
      tag: "CACHE",
      msg: "Fallback cache save: persistence not supported",
    });
    return true;
  }

  async bgsave(): Promise<boolean> {
    this.logger.warn({
      tag: "CACHE",
      msg: "Fallback cache bgsave: persistence not supported",
    });
    return true;
  }

  getStats(): { size: number; max: number } {
    return {
      size: this.cache.size,
      max: this.cache.max,
    };
  }
}
