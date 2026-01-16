/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CacheService } from "./service";
import type { Logger } from "./types";

export interface WarmingConfig {
  enabled: boolean;
  interval: number; // milliseconds
  endpoints: Array<{
    url: string;
    key: string;
    strategy?: "static" | "dynamic" | "user" | "api";
    ttl?: number;
  }>;
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

export class CacheWarmer {
  private cacheService: CacheService;
  private logger: Logger;
  private config: WarmingConfig;
  private intervalId?: NodeJS.Timeout;
  private isWarming = false;

  constructor(cacheService: CacheService, logger: Logger, config: WarmingConfig) {
    this.cacheService = cacheService;
    this.logger = logger;
    this.config = {
      ...config,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  /**
   * Start cache warming
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info({
        tag: "CACHE_WARMER",
        msg: "Cache warming is disabled",
      });
      return;
    }

    if (this.intervalId) {
      this.logger.warn({
        tag: "CACHE_WARMER",
        msg: "Cache warming is already running",
      });
      return;
    }

    this.logger.info({
      tag: "CACHE_WARMER",
      msg: "🔥 Starting cache warming",
      data: {
        interval: this.config.interval,
        endpoints: this.config.endpoints.length,
      },
    });

    // Initial warm
    await this.warm();

    // Schedule periodic warming
    this.intervalId = setInterval(async () => {
      await this.warm();
    }, this.config.interval);
  }

  /**
   * Stop cache warming
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.logger.info({
        tag: "CACHE_WARMER",
        msg: "⏹️ Cache warming stopped",
      });
    }
  }

  /**
   * Warm cache by fetching and caching endpoints
   */
  async warm(): Promise<void> {
    if (this.isWarming) {
      this.logger.warn({
        tag: "CACHE_WARMER",
        msg: "Cache warming already in progress",
      });
      return;
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      this.logger.info({
        tag: "CACHE_WARMER",
        msg: `🔥 Warming ${this.config.endpoints.length} endpoints`,
      });

      const results = await Promise.allSettled(this.config.endpoints.map(endpoint => this.warmEndpoint(endpoint)));

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      const duration = Date.now() - startTime;

      this.logger.info({
        tag: "CACHE_WARMER",
        msg: `✅ Cache warming completed`,
        data: {
          successful,
          failed,
          duration,
        },
      });
    } catch (error) {
      this.logger.error({
        tag: "CACHE_WARMER",
        msg: "Cache warming error:",
        error,
      });
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm a single endpoint
   */
  private async warmEndpoint(endpoint: {
    url: string;
    key: string;
    strategy?: "static" | "dynamic" | "user" | "api";
    ttl?: number;
  }): Promise<void> {
    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        // Fetch data from endpoint
        const response = await fetch(endpoint.url, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache the data
        await this.cacheService.set(endpoint.key, data, {
          strategy: endpoint.strategy || "dynamic",
          ttl: endpoint.ttl,
        });

        this.logger.info({
          tag: "CACHE_WARMER",
          msg: `✅ Warmed endpoint: ${endpoint.key}`,
        });

        return; // Success, exit retry loop
      } catch (error: any) {
        if (attempt < (this.config.retryAttempts || 3)) {
          const delay = (this.config.retryDelay || 1000) * attempt;
          this.logger.warn({
            tag: "CACHE_WARMER",
            msg: `⚠️ Failed to warm endpoint (attempt ${attempt}/${this.config.retryAttempts || 3}), retrying in ${delay}ms`,
            data: { key: endpoint.key, error: error.message },
          });

          await this.delay(delay);
        } else {
          this.logger.error({
            tag: "CACHE_WARMER",
            msg: `❌ Failed to warm endpoint after ${this.config.retryAttempts || 3} attempts`,
            data: { key: endpoint.key },
            error,
          });
          throw error;
        }
      }
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add endpoint to warming list
   */
  addEndpoint(endpoint: WarmingConfig["endpoints"][0]): void {
    this.config.endpoints.push(endpoint);
  }

  /**
   * Remove endpoint from warming list
   */
  removeEndpoint(key: string): void {
    this.config.endpoints = this.config.endpoints.filter(e => e.key !== key);
  }
}
