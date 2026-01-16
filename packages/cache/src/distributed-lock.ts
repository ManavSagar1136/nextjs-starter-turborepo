import type { CacheService } from "./service";
import type { Logger } from "./types";

export interface LockOptions {
  ttl?: number; // Lock expiration in seconds
  waitTimeout?: number; // Max time to wait for lock (ms)
  retryDelay?: number; // Delay between retries (ms)
}

export interface LockResult {
  acquired: boolean;
  lockId?: string;
  error?: string;
}

export class DistributedLock {
  private cacheService: CacheService;
  private logger: Logger;
  private readonly DEFAULT_TTL = 30; // 30 seconds
  private readonly DEFAULT_WAIT_TIMEOUT = 5000; // 5 seconds
  private readonly DEFAULT_RETRY_DELAY = 100; // 100ms

  constructor(cacheService: CacheService, logger: Logger) {
    this.cacheService = cacheService;
    this.logger = logger;
  }

  /**
   * Acquire a distributed lock
   */
  async acquire(key: string, options: LockOptions = {}): Promise<LockResult> {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const waitTimeout = options.waitTimeout || this.DEFAULT_WAIT_TIMEOUT;
    const retryDelay = options.retryDelay || this.DEFAULT_RETRY_DELAY;

    const lockKey = `lock:${key}`;
    const lockId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Try to acquire lock immediately
    const acquired = await this.tryAcquire(lockKey, lockId, ttl);

    if (acquired) {
      return {
        acquired: true,
        lockId,
      };
    }

    // If wait mode is enabled, retry with exponential backoff
    if (waitTimeout > 0) {
      const startTime = Date.now();
      let retryCount = 0;
      const maxRetries = Math.floor(waitTimeout / retryDelay);

      while (Date.now() - startTime < waitTimeout && retryCount < maxRetries) {
        const elapsed = Date.now() - startTime;
        const remaining = waitTimeout - elapsed;

        if (remaining <= 0) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(retryDelay * Math.pow(2, retryCount), remaining);

        await this.delay(delay);

        const retryAcquired = await this.tryAcquire(lockKey, lockId, ttl);
        if (retryAcquired) {
          this.logger.info({
            tag: "DISTRIBUTED_LOCK",
            msg: `Lock acquired after retry`,
            data: { key, retryCount, elapsed },
          });

          return {
            acquired: true,
            lockId,
          };
        }

        retryCount++;
      }
    }

    // Timeout reached
    this.logger.warn({
      tag: "DISTRIBUTED_LOCK",
      msg: `Lock acquisition timeout`,
      data: { key, waitTimeout },
    });

    return {
      acquired: false,
      error: "Lock acquisition timeout",
    };
  }

  /**
   * Try to acquire lock (single attempt)
   */
  private async tryAcquire(lockKey: string, lockId: string, ttl: number): Promise<boolean> {
    try {
      // Use SETNX (set if not exists) to atomically acquire lock
      const acquired = await this.cacheService.setnx(
        lockKey,
        {
          lockId,
          timestamp: Date.now(),
          ttl,
        },
        {
          ttl,
        }
      );

      if (acquired) {
        this.logger.info({
          tag: "DISTRIBUTED_LOCK",
          msg: `Lock acquired`,
          data: { key: lockKey, lockId },
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error({
        tag: "DISTRIBUTED_LOCK",
        msg: "Error acquiring lock:",
        error,
        data: { key: lockKey },
      });
      return false;
    }
  }

  /**
   * Release a distributed lock
   */
  async release(key: string, lockId: string): Promise<boolean> {
    const lockKey = `lock:${key}`;

    try {
      // Get current lock to verify ownership
      const result = await this.cacheService.get<{ lockId: string }>(lockKey);

      if (!result.cached || !result.data) {
        this.logger.warn({
          tag: "DISTRIBUTED_LOCK",
          msg: `Lock not found or already released`,
          data: { key: lockKey },
        });
        return false;
      }

      // Verify lock ownership
      if (result.data.lockId !== lockId) {
        this.logger.warn({
          tag: "DISTRIBUTED_LOCK",
          msg: `Lock ownership mismatch`,
          data: { key: lockKey, expected: lockId, actual: result.data.lockId },
        });
        return false;
      }

      // Release lock
      await this.cacheService.delete(lockKey);

      this.logger.info({
        tag: "DISTRIBUTED_LOCK",
        msg: `Lock released`,
        data: { key: lockKey, lockId },
      });

      return true;
    } catch (error) {
      this.logger.error({
        tag: "DISTRIBUTED_LOCK",
        msg: "Error releasing lock:",
        error,
        data: { key: lockKey },
      });
      return false;
    }
  }

  /**
   * Execute a function with a distributed lock
   */
  async withLock<T>(key: string, fn: () => Promise<T>, options: LockOptions = {}): Promise<T> {
    const lockResult = await this.acquire(key, options);

    if (!lockResult.acquired || !lockResult.lockId) {
      throw new Error(lockResult.error || "Failed to acquire lock");
    }

    try {
      return await fn();
    } finally {
      await this.release(key, lockResult.lockId);
    }
  }

  /**
   * Check if a lock exists
   */
  async isLocked(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.cacheService.exists(lockKey);
    return result;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
