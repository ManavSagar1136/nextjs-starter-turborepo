import type { Logger } from "./types";

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening
  resetTimeout?: number; // Time in ms before attempting to reset
  monitoringWindow?: number; // Time window for monitoring failures (ms)
}

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private options: Required<CircuitBreakerOptions>;
  private logger: Logger;

  constructor(logger: Logger, options: CircuitBreakerOptions = {}) {
    this.logger = logger;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringWindow: options.monitoringWindow || 60000, // 1 minute
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    this.checkReset();

    // If circuit is open, reject immediately
    if (this.state === "open") {
      const error = new Error("Circuit breaker is open");
      this.logger.warn({
        tag: "CIRCUIT_BREAKER",
        msg: "Request rejected - circuit breaker is open",
        data: { state: this.state, failures: this.failures },
      });
      throw error;
    }

    // If circuit is half-open, allow one request to test
    if (this.state === "half-open") {
      this.logger.info({
        tag: "CIRCUIT_BREAKER",
        msg: "Testing circuit breaker (half-open state)",
      });
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();

    if (this.state === "half-open") {
      // If we're in half-open and we succeeded, close the circuit
      this.state = "closed";
      this.failures = 0;
      this.logger.info({
        tag: "CIRCUIT_BREAKER",
        msg: "Circuit breaker closed after successful test",
      });
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === "half-open") {
      // If we're in half-open and we failed, open the circuit again
      this.state = "open";
      this.logger.warn({
        tag: "CIRCUIT_BREAKER",
        msg: "Circuit breaker reopened after failed test",
      });
    } else if (this.state === "closed" && this.failures >= this.options.failureThreshold) {
      // If we've exceeded the failure threshold, open the circuit
      this.state = "open";
      this.logger.error({
        tag: "CIRCUIT_BREAKER",
        msg: "Circuit breaker opened due to too many failures",
        data: {
          failures: this.failures,
          threshold: this.options.failureThreshold,
        },
      });
    }
  }

  /**
   * Check if circuit should be reset
   */
  private checkReset(): void {
    if (this.state === "open" && this.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.options.resetTimeout) {
        // Move to half-open state to test if service is back
        this.state = "half-open";
        this.logger.info({
          tag: "CIRCUIT_BREAKER",
          msg: "Circuit breaker moved to half-open state",
        });
      }
    }

    // Clean up old failures outside monitoring window
    if (this.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.options.monitoringWindow) {
        this.failures = 0;
      }
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;

    this.logger.info({
      tag: "CIRCUIT_BREAKER",
      msg: "Circuit breaker manually reset",
    });
  }
}
