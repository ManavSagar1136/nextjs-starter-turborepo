import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isNewRelicEnabled, getLinkingMetadata, generateNewRelicConfig } from "../newrelic.js";

describe("isNewRelicEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns true when enabled and license key present", () => {
    process.env.NEW_RELIC_ENABLED = "true";
    process.env.NEW_RELIC_LICENSE_KEY = "test-license-key";

    expect(isNewRelicEnabled()).toBe(true);
  });

  it("returns false when disabled", () => {
    process.env.NEW_RELIC_ENABLED = "false";
    process.env.NEW_RELIC_LICENSE_KEY = "test-license-key";

    expect(isNewRelicEnabled()).toBe(false);
  });

  it("returns false when license key missing", () => {
    process.env.NEW_RELIC_ENABLED = "true";
    delete process.env.NEW_RELIC_LICENSE_KEY;

    expect(isNewRelicEnabled()).toBe(false);
  });

  it("returns false when both missing", () => {
    delete process.env.NEW_RELIC_ENABLED;
    delete process.env.NEW_RELIC_LICENSE_KEY;

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
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
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
    process.env.NEW_RELIC_LICENSE_KEY = "env-key-456";

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
