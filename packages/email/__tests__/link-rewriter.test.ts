/**
 * @buildbase/email - Link Rewriter Tests
 */

import { describe, it, expect } from "vitest";
import {
  createClickTrackingUrl,
  rewriteLinks,
  restoreOriginalLinks,
  extractLinks,
} from "../src/tracking/link-rewriter.js";

describe("Link Rewriter", () => {
  const baseUrl = "https://example.com";
  const trackingId = "trk_test123";

  describe("createClickTrackingUrl", () => {
    it("should create tracking URL with encoded original URL", () => {
      const originalUrl = "https://target.com/page";
      const result = createClickTrackingUrl(trackingId, originalUrl, baseUrl);

      expect(result).toBe(`${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(originalUrl)}`);
    });

    it("should encode special characters in URL", () => {
      const originalUrl = "https://target.com/page?foo=bar&baz=qux";
      const result = createClickTrackingUrl(trackingId, originalUrl, baseUrl);

      expect(result).toContain(encodeURIComponent(originalUrl));
    });

    it("should handle URLs with unicode characters", () => {
      const originalUrl = "https://target.com/путь/страница";
      const result = createClickTrackingUrl(trackingId, originalUrl, baseUrl);

      expect(result).toContain(trackingId);
      expect(result).toContain("url=");
    });
  });

  describe("rewriteLinks", () => {
    it("should rewrite simple links", () => {
      const html = '<a href="https://target.com">Click here</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toContain(`/api/track/click/${trackingId}`);
      expect(result).toContain("data-original-href=");
    });

    it("should preserve original href in data attribute", () => {
      const html = '<a href="https://target.com/page">Link</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toContain('data-original-href="https://target.com/page"');
    });

    it("should rewrite multiple links", () => {
      const html = `
        <a href="https://link1.com">Link 1</a>
        <a href="https://link2.com">Link 2</a>
        <a href="https://link3.com">Link 3</a>
      `;
      const result = rewriteLinks(html, trackingId, baseUrl);

      // Count tracking URLs
      const matches = result.match(/\/api\/track\/click\//g);
      expect(matches).toHaveLength(3);
    });

    it("should skip anchor links", () => {
      const html = '<a href="#section">Jump to section</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toBe(html);
    });

    it("should skip mailto links", () => {
      const html = '<a href="mailto:test@example.com">Email us</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toBe(html);
      expect(result).not.toContain("/api/track/");
    });

    it("should skip tel links", () => {
      const html = '<a href="tel:+1234567890">Call us</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toBe(html);
    });

    it("should skip sms links", () => {
      const html = '<a href="sms:+1234567890">Text us</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toBe(html);
    });

    it("should skip unsubscribe links", () => {
      const html = '<a href="https://example.com/unsubscribe/token123">Unsubscribe</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toBe(html);
    });

    it("should skip javascript links", () => {
      const html = '<a href="javascript:void(0)">Click</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toBe(html);
    });

    it("should skip data URIs", () => {
      const html = '<a href="data:text/plain,Hello">Data link</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toBe(html);
    });

    it("should skip already-tracked links", () => {
      const html = `<a href="${baseUrl}/api/track/click/${trackingId}?url=test">Already tracked</a>`;
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toBe(html);
    });

    it("should preserve other link attributes", () => {
      const html = '<a href="https://target.com" class="btn" target="_blank" rel="noopener">Link</a>';
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toContain('class="btn"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener"');
    });

    it("should handle single quotes", () => {
      const html = "<a href='https://target.com'>Link</a>";
      const result = rewriteLinks(html, trackingId, baseUrl);

      expect(result).toContain(`/api/track/click/${trackingId}`);
    });

    it("should return original HTML if baseUrl is empty", () => {
      const html = '<a href="https://target.com">Link</a>';
      const result = rewriteLinks(html, trackingId, "");

      expect(result).toBe(html);
    });

    it("should return original HTML if trackingId is empty", () => {
      const html = '<a href="https://target.com">Link</a>';
      const result = rewriteLinks(html, "", baseUrl);

      expect(result).toBe(html);
    });
  });

  describe("restoreOriginalLinks", () => {
    it("should restore tracking URLs to original", () => {
      const originalUrl = "https://target.com/page";
      const trackedHtml = `<a href="${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(originalUrl)}">Link</a>`;
      const result = restoreOriginalLinks(trackedHtml);

      expect(result).toContain(originalUrl);
      expect(result).not.toContain("/api/track/click/");
    });

    it("should restore multiple tracking URLs", () => {
      const html = `
        <a href="${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent("https://link1.com")}">Link 1</a>
        <a href="${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent("https://link2.com")}">Link 2</a>
      `;
      const result = restoreOriginalLinks(html);

      expect(result).toContain("https://link1.com");
      expect(result).toContain("https://link2.com");
      expect(result).not.toContain("/api/track/click/");
    });

    it("should handle URLs with special characters", () => {
      const originalUrl = "https://target.com/page?foo=bar&baz=qux";
      const trackedHtml = `<a href="${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(originalUrl)}">Link</a>`;
      const result = restoreOriginalLinks(trackedHtml);

      expect(result).toContain(originalUrl);
    });

    it("should handle HTML without tracking URLs", () => {
      const html = '<a href="https://target.com">Regular link</a>';
      const result = restoreOriginalLinks(html);

      expect(result).toBe(html);
    });
  });

  describe("extractLinks", () => {
    it("should extract all href values", () => {
      const html = `
        <a href="https://link1.com">Link 1</a>
        <a href="https://link2.com">Link 2</a>
        <a href="https://link3.com">Link 3</a>
      `;
      const links = extractLinks(html);

      expect(links).toHaveLength(3);
      expect(links).toContain("https://link1.com");
      expect(links).toContain("https://link2.com");
      expect(links).toContain("https://link3.com");
    });

    it("should handle both single and double quotes", () => {
      const html = `
        <a href="https://double.com">Double</a>
        <a href='https://single.com'>Single</a>
      `;
      const links = extractLinks(html);

      expect(links).toContain("https://double.com");
      expect(links).toContain("https://single.com");
    });

    it("should extract all types of links", () => {
      const html = `
        <a href="https://web.com">Web</a>
        <a href="mailto:test@example.com">Email</a>
        <a href="#section">Anchor</a>
        <a href="tel:+123">Phone</a>
      `;
      const links = extractLinks(html);

      expect(links).toContain("https://web.com");
      expect(links).toContain("mailto:test@example.com");
      expect(links).toContain("#section");
      expect(links).toContain("tel:+123");
    });

    it("should return empty array for HTML without links", () => {
      const html = "<p>No links here</p>";
      const links = extractLinks(html);

      expect(links).toHaveLength(0);
    });

    it("should handle href attributes on other elements", () => {
      const html = `
        <a href="https://link.com">Link</a>
        <link href="/styles.css" rel="stylesheet">
        <base href="https://base.com">
      `;
      const links = extractLinks(html);

      expect(links).toContain("https://link.com");
      expect(links).toContain("/styles.css");
      expect(links).toContain("https://base.com");
    });
  });
});
