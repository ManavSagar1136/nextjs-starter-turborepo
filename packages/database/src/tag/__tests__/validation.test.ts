/**
 * @buildbase/database - Tag Validation Tests
 *
 * Unit tests for tag validation functions
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateTagName } from "../../assets/validation.utils";
import { prisma } from "../../index";
import { MIN_TAG_NAME_LENGTH, MAX_TAG_NAME_LENGTH, TAG_NAME_PATTERN } from "../constants";

// Mock Prisma
vi.mock("../../index", () => ({
  prisma: {
    mediaTag: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Tag Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateTagName", () => {
    it("should accept valid tag names", () => {
      expect(() => validateTagName("My Tag")).not.toThrow();
      expect(() => validateTagName("tag-123")).not.toThrow();
      expect(() => validateTagName("Tag_Name")).not.toThrow();
      expect(() => validateTagName("A")).not.toThrow(); // Min length
      expect(() => validateTagName("A".repeat(50))).not.toThrow(); // Max length
    });

    it("should reject empty tag names", () => {
      expect(() => validateTagName("")).toThrow("Tag name is required");
      expect(() => validateTagName("   ")).toThrow("Tag name must be at least 1 character");
    });

    it("should reject tag names that are too long", () => {
      const longName = "A".repeat(51);
      expect(() => validateTagName(longName)).toThrow(
        `Tag name must be no more than ${MAX_TAG_NAME_LENGTH} characters`
      );
    });

    it("should reject tag names with invalid characters", () => {
      expect(() => validateTagName("Tag@Name")).toThrow(
        "Tag name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
      expect(() => validateTagName("Tag#Name")).toThrow(
        "Tag name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
      expect(() => validateTagName("Tag$Name")).toThrow(
        "Tag name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
      expect(() => validateTagName("Tag/Name")).toThrow(
        "Tag name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
    });

    it("should accept tag names with allowed special characters", () => {
      expect(() => validateTagName("My-Tag")).not.toThrow();
      expect(() => validateTagName("My_Tag")).not.toThrow();
      expect(() => validateTagName("My Tag 123")).not.toThrow();
    });
  });
});
