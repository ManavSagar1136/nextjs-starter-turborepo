import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @buildbase/env to allow test environment variable control
// This creates a proxy that reads from process.env dynamically
// Must be hoisted (before any imports that use @buildbase/env)
vi.mock("@buildbase/env", () => {
  return {
    env: new Proxy({} as Record<string, string | undefined>, {
      get(_target, prop: string) {
        // Return process.env value, or undefined if not set
        return process.env[prop];
      },
    }),
    isDevelopment: () => process.env.NODE_ENV === "development",
    isProduction: () => process.env.NODE_ENV === "production",
    isTest: () => process.env.NODE_ENV === "test",
  };
});

import { isNewRelicEnabled, getLinkingMetadata, generateNewRelicConfig } from "../newrelic.js";

describe("isNewRelicEnabled", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true when enabled and license key present", () => {
    vi.stubEnv("NEW_RELIC_ENABLED", "true");
    vi.stubEnv("NEW_RELIC_LICENSE_KEY", "test-license-key");

    expect(isNewRelicEnabled()).toBe(true);
  });

  it("returns false when disabled", () => {
    vi.stubEnv("NEW_RELIC_ENABLED", "false");
    vi.stubEnv("NEW_RELIC_LICENSE_KEY", "test-license-key");

    expect(isNewRelicEnabled()).toBe(false);
  });

  it("returns false when license key missing", () => {
    vi.stubEnv("NEW_RELIC_ENABLED", "true");
    // Don't set NEW_RELIC_LICENSE_KEY

    expect(isNewRelicEnabled()).toBe(false);
  });

  it("returns false when both missing", () => {
    // Don't set either env var

    expect(isNewRelicEnabled()).toBe(false);
  });
});

describe("getLinkingMetadata", () => {
  it("returns empty object when newrelic not available", () => {
    // newrelic package is not installed in dev, so this should return {}
    const metadata = getLinkingMetadata();
    expect(metadata).toEqual({});
  });
});

describe("generateNewRelicConfig", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates basic config", () => {
    const config = generateNewRelicConfig({
      appName: "test-app",
      licenseKey: "test-key-123",
    });

    expect(config.app_name).toEqual(["test-app"]);
    expect(config.license_key).toBe("test-key-123");
    expect(config.distributed_tracing).toEqual({ enabled: true });
  });

  it("uses env license key as fallback", () => {
    vi.stubEnv("NEW_RELIC_LICENSE_KEY", "env-key-456");

    const config = generateNewRelicConfig({
      appName: "test-app",
    });

    expect(config.license_key).toBe("env-key-456");
  });

  it("enables distributed tracing by default", () => {
    const config = generateNewRelicConfig({
      appName: "test-app",
    });

    expect(config.distributed_tracing).toEqual({ enabled: true });
  });

  it("allows disabling distributed tracing", () => {
    const config = generateNewRelicConfig({
      appName: "test-app",
      distributedTracing: false,
    });

    expect(config.distributed_tracing).toEqual({ enabled: false });
  });

  it("enables log forwarding by default", () => {
    const config = generateNewRelicConfig({
      appName: "test-app",
    });

    expect(config.application_logging).toMatchObject({
      enabled: true,
      forwarding: {
        enabled: true,
      },
    });
  });

  it("allows disabling log forwarding", () => {
    const config = generateNewRelicConfig({
      appName: "test-app",
      logForwarding: false,
    });

    expect(config.application_logging).toMatchObject({
      forwarding: {
        enabled: false,
      },
    });
  });

  it("sets log level", () => {
    const config = generateNewRelicConfig({
      appName: "test-app",
      logLevel: "debug",
    });

    expect(config.logging).toEqual({ level: "debug" });
  });

  it("uses info log level by default", () => {
    const config = generateNewRelicConfig({
      appName: "test-app",
    });

    expect(config.logging).toEqual({ level: "info" });
  });

  it("excludes sensitive headers", () => {
    const config = generateNewRelicConfig({
      appName: "test-app",
    });

    const excludeList = (config.attributes as { exclude: string[] }).exclude;
    expect(excludeList).toContain("request.headers.cookie");
    expect(excludeList).toContain("request.headers.authorization");
    expect(excludeList).toContain("response.headers.cookie");
  });
});
