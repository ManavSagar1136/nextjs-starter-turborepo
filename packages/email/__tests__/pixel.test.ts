/**
 * @buildbase/email - Tracking Pixel Tests
 */

import { describe, it, expect } from "vitest";
import {
  createTrackingPixel,
  insertTrackingPixel,
  removeTrackingPixel,
  getTransparentPixel,
} from "../src/tracking/pixel.js";

describe("Tracking Pixel", () => {
  const baseUrl = "https://example.com";
  const trackingId = "trk_test123";

  describe("createTrackingPixel", () => {
    it("should create valid tracking pixel HTML", () => {
      const pixel = createTrackingPixel(trackingId, baseUrl);

      expect(pixel).toContain("<img");
      expect(pixel).toContain(`src="${baseUrl}/api/track/open/${trackingId}"`);
      expect(pixel).toContain('width="1"');
      expect(pixel).toContain('height="1"');
      expect(pixel).toContain('style="display:none');
    });

    it("should create pixel with correct alt attribute", () => {
      const pixel = createTrackingPixel(trackingId, baseUrl);
      expect(pixel).toContain('alt=""');
    });

    it("should handle different tracking IDs", () => {
      const pixel1 = createTrackingPixel("trk_abc", baseUrl);
      const pixel2 = createTrackingPixel("trk_xyz", baseUrl);

      expect(pixel1).toContain("trk_abc");
      expect(pixel2).toContain("trk_xyz");
      expect(pixel1).not.toBe(pixel2);
    });

    it("should handle different base URLs", () => {
      const pixel1 = createTrackingPixel(trackingId, "https://app1.com");
      const pixel2 = createTrackingPixel(trackingId, "https://app2.com");

      expect(pixel1).toContain("https://app1.com");
      expect(pixel2).toContain("https://app2.com");
    });
  });

  describe("insertTrackingPixel", () => {
    it("should insert pixel before </body>", () => {
      const html = "<html><body><p>Hello</p></body></html>";
      const result = insertTrackingPixel(html, trackingId, baseUrl);

      expect(result).toContain(`/api/track/open/${trackingId}`);
      expect(result).toMatch(/<img[^>]*><\/body>/);
    });

    it("should handle uppercase </BODY>", () => {
      const html = "<html><BODY><p>Hello</p></BODY></html>";
      const result = insertTrackingPixel(html, trackingId, baseUrl);

      expect(result).toContain(`/api/track/open/${trackingId}`);
    });

    it("should append pixel if no body tag", () => {
      const html = "<h1>Hello</h1><p>World</p>";
      const result = insertTrackingPixel(html, trackingId, baseUrl);

      expect(result).toContain(`/api/track/open/${trackingId}`);
      expect(result).toMatch(/<p>World<\/p><img/);
    });

    it("should return original HTML if baseUrl is empty", () => {
      const html = "<body><p>Test</p></body>";
      const result = insertTrackingPixel(html, trackingId, "");

      expect(result).toBe(html);
    });

    it("should return original HTML if trackingId is empty", () => {
      const html = "<body><p>Test</p></body>";
      const result = insertTrackingPixel(html, "", baseUrl);

      expect(result).toBe(html);
    });
  });

  describe("removeTrackingPixel", () => {
    it("should remove tracking pixels", () => {
      const html = `<body><p>Hello</p><img src="https://example.com/api/track/open/trk_123" width="1" height="1"></body>`;
      const result = removeTrackingPixel(html);

      expect(result).not.toContain("/api/track/open/");
      expect(result).toContain("<p>Hello</p>");
    });

    it("should remove multiple tracking pixels", () => {
      const html = `
        <body>
          <img src="https://app.com/api/track/open/trk_1" />
          <p>Content</p>
          <img src="https://app.com/api/track/open/trk_2" />
        </body>
      `;
      const result = removeTrackingPixel(html);

      expect(result).not.toContain("/api/track/open/");
      expect(result).toContain("<p>Content</p>");
    });

    it("should not affect other images", () => {
      const html = `<body><img src="https://example.com/logo.png" alt="Logo"></body>`;
      const result = removeTrackingPixel(html);

      expect(result).toContain("logo.png");
    });

    it("should handle HTML without tracking pixels", () => {
      const html = "<body><p>No pixels here</p></body>";
      const result = removeTrackingPixel(html);

      expect(result).toBe(html);
    });
  });

  describe("getTransparentPixel", () => {
    it("should return a Buffer", () => {
      const pixel = getTransparentPixel();
      expect(pixel).toBeInstanceOf(Buffer);
    });

    it("should return a valid GIF", () => {
      const pixel = getTransparentPixel();
      // GIF magic bytes: 47 49 46 38 (GIF8)
      expect(pixel[0]).toBe(0x47); // G
      expect(pixel[1]).toBe(0x49); // I
      expect(pixel[2]).toBe(0x46); // F
      expect(pixel[3]).toBe(0x38); // 8
    });

    it("should return 42 bytes (1x1 transparent GIF)", () => {
      const pixel = getTransparentPixel();
      expect(pixel.length).toBe(42);
    });

    it("should return the same buffer every time", () => {
      const pixel1 = getTransparentPixel();
      const pixel2 = getTransparentPixel();

      expect(pixel1.equals(pixel2)).toBe(true);
    });
  });
});
