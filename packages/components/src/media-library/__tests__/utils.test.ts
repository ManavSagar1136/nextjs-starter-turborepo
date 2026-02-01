import { describe, it, expect } from "vitest";
import {
  formatFileSize,
  getFileTypeConfig,
  isImageContentType,
  isVideoContentType,
  isAudioContentType,
  getFileExtension,
  truncateText,
  formatRelativeTime,
  MIME_TYPE_FILTERS,
} from "../utils";

describe("formatFileSize", () => {
  it("should format bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("should format kilobytes", () => {
    // Implementation may not use decimals for exact values
    expect(formatFileSize(1024)).toMatch(/1.*KB/);
    expect(formatFileSize(2048)).toMatch(/2.*KB/);
  });

  it("should format megabytes", () => {
    expect(formatFileSize(1048576)).toMatch(/1.*MB/);
    expect(formatFileSize(5242880)).toMatch(/5.*MB/);
  });

  it("should format gigabytes", () => {
    expect(formatFileSize(1073741824)).toMatch(/1.*GB/);
    expect(formatFileSize(2147483648)).toMatch(/2.*GB/);
  });

  it("should handle zero", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });
});

describe("getFileTypeConfig", () => {
  it("should return config for image types", () => {
    const config = getFileTypeConfig("image/png");
    expect(config).toBeDefined();
    expect(config.icon).toBeDefined();
  });

  it("should return config for video types", () => {
    const config = getFileTypeConfig("video/mp4");
    expect(config).toBeDefined();
  });

  it("should return config for audio types", () => {
    const config = getFileTypeConfig("audio/mpeg");
    expect(config).toBeDefined();
  });

  it("should return config for document types", () => {
    const config = getFileTypeConfig("application/pdf");
    expect(config).toBeDefined();
  });

  it("should return config for unknown types", () => {
    const config = getFileTypeConfig("application/octet-stream");
    expect(config).toBeDefined();
  });
});

describe("isImageContentType", () => {
  it("should return true for image content types", () => {
    expect(isImageContentType("image/png")).toBe(true);
    expect(isImageContentType("image/jpeg")).toBe(true);
    expect(isImageContentType("image/webp")).toBe(true);
    expect(isImageContentType("image/gif")).toBe(true);
  });

  it("should return false for non-image types", () => {
    expect(isImageContentType("video/mp4")).toBe(false);
    expect(isImageContentType("application/pdf")).toBe(false);
    expect(isImageContentType("text/plain")).toBe(false);
  });
});

describe("isVideoContentType", () => {
  it("should return true for video content types", () => {
    expect(isVideoContentType("video/mp4")).toBe(true);
    expect(isVideoContentType("video/webm")).toBe(true);
  });

  it("should return false for non-video types", () => {
    expect(isVideoContentType("image/png")).toBe(false);
    expect(isVideoContentType("audio/mpeg")).toBe(false);
  });
});

describe("isAudioContentType", () => {
  it("should return true for audio content types", () => {
    expect(isAudioContentType("audio/mpeg")).toBe(true);
    expect(isAudioContentType("audio/wav")).toBe(true);
  });

  it("should return false for non-audio types", () => {
    expect(isAudioContentType("video/mp4")).toBe(false);
    expect(isAudioContentType("image/png")).toBe(false);
  });
});

describe("getFileExtension", () => {
  it("should extract file extension from filename (uppercase)", () => {
    expect(getFileExtension("document.pdf")).toBe("PDF");
    expect(getFileExtension("image.PNG")).toBe("PNG");
    expect(getFileExtension("file.name.with.dots.txt")).toBe("TXT");
  });

  it("should return empty string for files without extension", () => {
    expect(getFileExtension("filename")).toBe("");
    expect(getFileExtension("")).toBe("");
    expect(getFileExtension(undefined)).toBe("");
  });

  it("should fallback to content type extension (uppercase)", () => {
    expect(getFileExtension(undefined, "image/png")).toBe("PNG");
    expect(getFileExtension(undefined, "application/pdf")).toBe("PDF");
  });
});

describe("truncateText", () => {
  it("should truncate text longer than max length", () => {
    expect(truncateText("This is a long text", 10)).toBe("This is a ...");
  });

  it("should not truncate text shorter than max length", () => {
    expect(truncateText("Short", 10)).toBe("Short");
  });

  it("should handle exact length", () => {
    expect(truncateText("Exactly 10", 10)).toBe("Exactly 10");
  });
});

describe("formatRelativeTime", () => {
  it("should format recent dates as relative time", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toMatch(/just now|seconds ago/i);
  });

  it("should format dates from string", () => {
    const dateStr = new Date().toISOString();
    expect(formatRelativeTime(dateStr)).toBeDefined();
  });
});

describe("MIME_TYPE_FILTERS", () => {
  it("should have filter options", () => {
    expect(Array.isArray(MIME_TYPE_FILTERS)).toBe(true);
    expect(MIME_TYPE_FILTERS.length).toBeGreaterThan(0);
  });

  it("should have label and value for each filter", () => {
    for (const filter of MIME_TYPE_FILTERS) {
      expect(filter.label).toBeDefined();
      expect(filter.value).toBeDefined();
    }
  });
});
