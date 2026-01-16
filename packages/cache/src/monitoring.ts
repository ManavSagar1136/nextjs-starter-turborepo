/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CacheService } from "./service";
import type { Logger } from "./types";

export interface CacheMetrics {
  timestamp: number;
  totalKeys: number;
  memoryUsage: string;
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  errorRate: number;
  strategies: Record<string, number>;
  rateLimitStats: {
    totalRequests: number;
    blockedRequests: number;
    averageRequestsPerMinute: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: "warning" | "error" | "critical";
  message: string;
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
}

export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  alertThresholds: {
    hitRate: number;
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
  };
  retentionDays: number;
}

export class CacheMonitor {
  private metrics: CacheMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private config: DashboardConfig;
  public isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private cacheService: CacheService;
  private logger: Logger;
  private operationCounts: {
    hits: number;
    misses: number;
    errors: number;
    totalRequests: number;
  } = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0,
  };
  private responseTimes: number[] = [];

  constructor(cacheService: CacheService, logger: Logger, config?: Partial<DashboardConfig>) {
    this.cacheService = cacheService;
    this.logger = logger;
    this.config = {
      refreshInterval: config?.refreshInterval || 30000, // 30 seconds
      alertThresholds: {
        hitRate: config?.alertThresholds?.hitRate || 0.3, // 30%
        errorRate: config?.alertThresholds?.errorRate || 0.1, // 10%
        responseTime: config?.alertThresholds?.responseTime || 2000, // 2 seconds
        memoryUsage: config?.alertThresholds?.memoryUsage || 0.95, // 95%
      },
      retentionDays: config?.retentionDays || 7,
    };
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.logger.info({
      tag: "CACHE_MONITOR",
      msg: "🚀 Cache monitoring started",
    });

    // Initial metrics collection
    await this.collectMetrics();

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.checkAlerts();
      this.cleanupOldData();
    }, this.config.refreshInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    this.logger.info({
      tag: "CACHE_MONITOR",
      msg: "⏹️ Cache monitoring stopped",
    });
  }

  /**
   * Collect current metrics
   */
  public async collectMetrics(): Promise<CacheMetrics | null> {
    try {
      const startTime = Date.now();

      // Get cache statistics
      const stats = await this.cacheService.getStats();
      const health = await this.cacheService.healthCheck();

      // Calculate performance metrics
      const totalRequests = this.operationCounts.totalRequests || 1;
      const hitRate = this.operationCounts.hits / totalRequests;
      const missRate = this.operationCounts.misses / totalRequests;
      const errorRate = this.operationCounts.errors / totalRequests;
      const avgResponseTime =
        this.responseTimes.length > 0 ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0;

      const metrics: CacheMetrics = {
        timestamp: Date.now(),
        totalKeys: stats.totalKeys || 0,
        memoryUsage: "N/A", // Upstash doesn't expose memory usage
        hitRate,
        missRate,
        errorRate,
        averageResponseTime: avgResponseTime,
        strategies: stats.strategies || {},
        rateLimitStats: {
          totalRequests: this.operationCounts.totalRequests,
          blockedRequests: 0, // Would need rate limiter integration
          averageRequestsPerMinute: (this.operationCounts.totalRequests / 60) * 1000,
        },
      };

      this.metrics.push(metrics);

      // Keep only recent metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Reset counters
      this.operationCounts = { hits: 0, misses: 0, errors: 0, totalRequests: 0 };
      this.responseTimes = [];

      this.logger.info({
        tag: "CACHE_MONITOR",
        msg: "📊 Cache metrics collected:",
        data: {
          totalKeys: metrics.totalKeys,
          hitRate: (hitRate * 100).toFixed(2) + "%",
          errorRate: (errorRate * 100).toFixed(2) + "%",
        },
      });

      const latest = this.metrics[this.metrics.length - 1];
      return latest || null;
    } catch (error) {
      this.logger.error({
        tag: "CACHE_MONITOR",
        msg: "Error collecting cache metrics:",
        error,
      });
      return null;
    }
  }

  /**
   * Record cache operation for metrics
   */
  recordOperation(type: "hit" | "miss" | "error", responseTime?: number): void {
    this.operationCounts.totalRequests++;
    if (type === "hit") this.operationCounts.hits++;
    if (type === "miss") this.operationCounts.misses++;
    if (type === "error") this.operationCounts.errors++;
    if (responseTime !== undefined) {
      this.responseTimes.push(responseTime);
      // Keep only last 1000 response times
      if (this.responseTimes.length > 1000) {
        this.responseTimes = this.responseTimes.slice(-1000);
      }
    }
  }

  /**
   * Check for performance alerts
   */
  private async checkAlerts(): Promise<void> {
    if (this.metrics.length === 0) return;

    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return;

    // Check hit rate
    if (latest.hitRate < this.config.alertThresholds.hitRate) {
      this.addAlert({
        type: "warning",
        message: `Low cache hit rate: ${(latest.hitRate * 100).toFixed(2)}%`,
        metric: "hitRate",
        value: latest.hitRate,
        threshold: this.config.alertThresholds.hitRate,
      });
    }

    // Check error rate
    if (latest.errorRate > this.config.alertThresholds.errorRate) {
      this.addAlert({
        type: "error",
        message: `High cache error rate: ${(latest.errorRate * 100).toFixed(2)}%`,
        metric: "errorRate",
        value: latest.errorRate,
        threshold: this.config.alertThresholds.errorRate,
      });
    }

    // Check response time
    if (latest.averageResponseTime > this.config.alertThresholds.responseTime) {
      this.addAlert({
        type: "warning",
        message: `High cache response time: ${latest.averageResponseTime.toFixed(2)}ms`,
        metric: "responseTime",
        value: latest.averageResponseTime,
        threshold: this.config.alertThresholds.responseTime,
      });
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: Omit<PerformanceAlert, "id" | "timestamp">): void {
    const fullAlert: PerformanceAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    this.alerts.push(fullAlert);

    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    this.logger.warn({
      tag: "CACHE_MONITOR",
      msg: `⚠️ ${fullAlert.message}`,
      data: fullAlert,
    });
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): CacheMetrics | null {
    const latest = this.metrics[this.metrics.length - 1];
    return latest || null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): CacheMetrics[] {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Get cache health status
   */
  async getHealthStatus(): Promise<{
    status: "healthy" | "warning" | "critical";
    metrics: CacheMetrics | null;
    alerts: PerformanceAlert[];
    recommendations: string[];
  }> {
    const current = this.getCurrentMetrics();
    if (!current) {
      return {
        status: "healthy",
        metrics: null,
        alerts: [],
        recommendations: ["No metrics available"],
      };
    }

    const alerts = this.getAlerts();
    const criticalAlerts = alerts.filter(a => a.type === "critical");
    const errorAlerts = alerts.filter(a => a.type === "error");

    let status: "healthy" | "warning" | "critical" = "healthy";
    const recommendations: string[] = [];

    if (criticalAlerts.length > 0 || errorAlerts.length > 3) {
      status = "critical";
      recommendations.push("Immediate attention required");
    } else if (errorAlerts.length > 0 || current.hitRate < 0.5) {
      status = "warning";
      recommendations.push("Monitor cache performance closely");
    }

    if (current.hitRate < 0.3) {
      recommendations.push("Consider increasing cache TTL or warming cache");
    }

    if (current.errorRate > 0.05) {
      recommendations.push("Check Redis connection and health");
    }

    return {
      status,
      metrics: current,
      alerts,
      recommendations,
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    metrics: CacheMetrics[];
    alerts: PerformanceAlert[];
    config: DashboardConfig;
  } {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      config: this.config,
    };
  }
}
