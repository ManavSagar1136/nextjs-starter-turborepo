/**
 * @buildbase/email - Tracking Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TrackingService } from "../src/tracking/tracking.service.js";
import type { TrackingConfig, TrackingContext } from "../src/tracking/types.js";

// Create mock Prisma client
function createMockPrisma() {
  return {
    emailEvent: {
      create: vi.fn().mockResolvedValue({ id: "event_123" }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  } as unknown as Parameters<typeof TrackingService>[0];
}

describe("TrackingService", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let trackingService: TrackingService;

  beforeEach(() => {
    vi.stubEnv("APP_URL", "https://app.example.com");
    prisma = createMockPrisma();
    trackingService = new TrackingService(prisma);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create with default config", () => {
      const service = new TrackingService(prisma);

      expect(service.isEnabled).toBe(true);
      expect(service.currentConfig.trackOpens).toBe(true);
      expect(service.currentConfig.trackClicks).toBe(true);
    });

    it("should merge custom config", () => {
      const customConfig: Partial<TrackingConfig> = {
        enabled: false,
        trackOpens: false,
      };

      const service = new TrackingService(prisma, customConfig);

      expect(service.isEnabled).toBe(false);
      expect(service.currentConfig.trackOpens).toBe(false);
      expect(service.currentConfig.trackClicks).toBe(true); // Default
    });

    it("should use custom baseUrl", () => {
      const service = new TrackingService(prisma, {
        baseUrl: "https://custom.example.com",
      });

      expect(service.currentConfig.baseUrl).toBe("https://custom.example.com");
    });
  });

  describe("addTracking", () => {
    const context: TrackingContext = {
      trackingId: "trk_test123",
      recipientEmail: "user@example.com",
    };

    it("should add tracking pixel and rewrite links", () => {
      const html = '<body><a href="https://target.com">Click</a></body>';

      const result = trackingService.addTracking(html, context);

      expect(result).toContain("/api/track/open/trk_test123");
      expect(result).toContain("/api/track/click/trk_test123");
    });

    it("should only add pixel when trackClicks is disabled", () => {
      const service = new TrackingService(prisma, { trackClicks: false });
      const html = '<body><a href="https://target.com">Click</a></body>';

      const result = service.addTracking(html, context);

      expect(result).toContain("/api/track/open/");
      expect(result).not.toContain("/api/track/click/");
    });

    it("should only rewrite links when trackOpens is disabled", () => {
      const service = new TrackingService(prisma, { trackOpens: false });
      const html = '<body><a href="https://target.com">Click</a></body>';

      const result = service.addTracking(html, context);

      expect(result).not.toContain("/api/track/open/");
      expect(result).toContain("/api/track/click/");
    });

    it("should return original HTML when tracking is disabled", () => {
      const service = new TrackingService(prisma, { enabled: false });
      const html = '<body><a href="https://target.com">Click</a></body>';

      const result = service.addTracking(html, context);

      expect(result).toBe(html);
    });
  });

  describe("recordOpen", () => {
    it("should create OPENED event", async () => {
      await trackingService.recordOpen("trk_123");

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trackingId: "trk_123",
          type: "OPENED",
        }),
      });
    });

    it("should include request info when provided", async () => {
      await trackingService.recordOpen("trk_123", {
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      });
    });

    it("should not throw on database error", async () => {
      prisma.emailEvent.create = vi.fn().mockRejectedValue(new Error("DB Error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Should not throw
      await expect(trackingService.recordOpen("trk_123")).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("recordClick", () => {
    it("should create CLICKED event with linkUrl", async () => {
      await trackingService.recordClick("trk_123", "https://clicked.com");

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trackingId: "trk_123",
          type: "CLICKED",
          linkUrl: "https://clicked.com",
        }),
      });
    });

    it("should include request info", async () => {
      await trackingService.recordClick("trk_123", "https://clicked.com", {
        ipAddress: "10.0.0.1",
        userAgent: "Chrome",
      });

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: "10.0.0.1",
          userAgent: "Chrome",
        }),
      });
    });
  });

  describe("recordSent", () => {
    it("should create SENT event", async () => {
      await trackingService.recordSent("trk_123");

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trackingId: "trk_123",
          type: "SENT",
        }),
      });
    });
  });

  describe("recordDelivered", () => {
    it("should create DELIVERED event", async () => {
      await trackingService.recordDelivered("trk_123");

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trackingId: "trk_123",
          type: "DELIVERED",
        }),
      });
    });
  });

  describe("recordBounce", () => {
    it("should create BOUNCED event with bounce type", async () => {
      await trackingService.recordBounce("trk_123", "hard");

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trackingId: "trk_123",
          type: "BOUNCED",
          metadata: { type: "hard" },
        }),
      });
    });

    it("should handle soft bounce", async () => {
      await trackingService.recordBounce("trk_123", "soft");

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { type: "soft" },
        }),
      });
    });
  });

  describe("recordUnsubscribe", () => {
    it("should create UNSUBSCRIBED event", async () => {
      await trackingService.recordUnsubscribe("trk_123", "user@example.com");

      expect(prisma.emailEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trackingId: "trk_123",
          type: "UNSUBSCRIBED",
          metadata: { email: "user@example.com" },
        }),
      });
    });
  });

  describe("getMetrics", () => {
    it("should return empty metrics for new tracking ID", async () => {
      const metrics = await trackingService.getMetrics("trk_new");

      expect(metrics.trackingId).toBe("trk_new");
      expect(metrics.sent).toBe(false);
      expect(metrics.opened).toBe(false);
      expect(metrics.clicked).toBe(false);
      expect(metrics.openCount).toBe(0);
      expect(metrics.clickCount).toBe(0);
    });

    it("should calculate metrics from events", async () => {
      prisma.emailEvent.findMany = vi.fn().mockResolvedValue([
        { type: "SENT", timestamp: new Date("2024-01-01"), ipAddress: null, linkUrl: null, metadata: null },
        { type: "DELIVERED", timestamp: new Date("2024-01-01"), ipAddress: null, linkUrl: null, metadata: null },
        { type: "OPENED", timestamp: new Date("2024-01-02"), ipAddress: "1.1.1.1", linkUrl: null, metadata: null },
        { type: "OPENED", timestamp: new Date("2024-01-02"), ipAddress: "1.1.1.1", linkUrl: null, metadata: null },
        { type: "OPENED", timestamp: new Date("2024-01-02"), ipAddress: "2.2.2.2", linkUrl: null, metadata: null },
        {
          type: "CLICKED",
          timestamp: new Date("2024-01-03"),
          ipAddress: "1.1.1.1",
          linkUrl: "https://link1.com",
          metadata: null,
        },
        {
          type: "CLICKED",
          timestamp: new Date("2024-01-03"),
          ipAddress: "1.1.1.1",
          linkUrl: "https://link2.com",
          metadata: null,
        },
      ]);

      const metrics = await trackingService.getMetrics("trk_123");

      expect(metrics.sent).toBe(true);
      expect(metrics.delivered).toBe(true);
      expect(metrics.opened).toBe(true);
      expect(metrics.openCount).toBe(3);
      expect(metrics.uniqueOpens).toBe(2); // 2 unique IPs
      expect(metrics.clicked).toBe(true);
      expect(metrics.clickCount).toBe(2);
      expect(metrics.clickedLinks).toHaveLength(2);
    });

    it("should detect bounced status", async () => {
      prisma.emailEvent.findMany = vi.fn().mockResolvedValue([
        { type: "SENT", timestamp: new Date(), ipAddress: null, linkUrl: null, metadata: null },
        { type: "BOUNCED", timestamp: new Date(), ipAddress: null, linkUrl: null, metadata: { type: "hard" } },
      ]);

      const metrics = await trackingService.getMetrics("trk_bounced");

      expect(metrics.bounced).toBe(true);
      expect(metrics.bounceType).toBe("hard");
    });

    it("should detect unsubscribed status", async () => {
      prisma.emailEvent.findMany = vi
        .fn()
        .mockResolvedValue([
          { type: "UNSUBSCRIBED", timestamp: new Date(), ipAddress: null, linkUrl: null, metadata: null },
        ]);

      const metrics = await trackingService.getMetrics("trk_unsub");

      expect(metrics.unsubscribed).toBe(true);
    });
  });

  describe("getBulkMetrics", () => {
    it("should return metrics for multiple tracking IDs", async () => {
      prisma.emailEvent.findMany = vi.fn().mockResolvedValue([
        { trackingId: "trk_1", type: "SENT", timestamp: new Date(), ipAddress: null, linkUrl: null, metadata: null },
        {
          trackingId: "trk_1",
          type: "OPENED",
          timestamp: new Date(),
          ipAddress: "1.1.1.1",
          linkUrl: null,
          metadata: null,
        },
        { trackingId: "trk_2", type: "SENT", timestamp: new Date(), ipAddress: null, linkUrl: null, metadata: null },
      ]);

      const metrics = await trackingService.getBulkMetrics(["trk_1", "trk_2", "trk_3"]);

      expect(metrics.size).toBe(3);
      expect(metrics.get("trk_1")?.opened).toBe(true);
      expect(metrics.get("trk_2")?.opened).toBe(false);
      expect(metrics.get("trk_3")?.sent).toBe(false);
    });
  });

  describe("getTrackingPixel", () => {
    it("should return transparent pixel buffer", () => {
      const pixel = trackingService.getTrackingPixel();

      expect(pixel).toBeInstanceOf(Buffer);
      expect(pixel.length).toBe(43);
    });
  });

  describe("isEnabled", () => {
    it("should return true when enabled", () => {
      const service = new TrackingService(prisma, { enabled: true });
      expect(service.isEnabled).toBe(true);
    });

    it("should return false when disabled", () => {
      const service = new TrackingService(prisma, { enabled: false });
      expect(service.isEnabled).toBe(false);
    });
  });

  describe("currentConfig", () => {
    it("should return copy of current config", () => {
      const service = new TrackingService(prisma, {
        enabled: true,
        trackOpens: true,
        trackClicks: false,
      });

      const config = service.currentConfig;

      expect(config.enabled).toBe(true);
      expect(config.trackOpens).toBe(true);
      expect(config.trackClicks).toBe(false);

      // Should be a copy, not the original
      config.enabled = false;
      expect(service.currentConfig.enabled).toBe(true);
    });
  });
});
