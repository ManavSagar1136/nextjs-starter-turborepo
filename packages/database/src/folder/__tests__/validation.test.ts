/**
 * @buildbase/database - Folder Validation Tests
 *
 * Unit tests for folder validation functions
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateFolderName, validateFolderNameUniqueness } from "../../assets/validation.utils";
import { prisma } from "../../index";
import { MIN_FOLDER_NAME_LENGTH, MAX_FOLDER_NAME_LENGTH, FOLDER_NAME_PATTERN, MAX_FOLDER_DEPTH } from "../constants";

// Mock Prisma
vi.mock("../../index", () => ({
  prisma: {
    assetFolder: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Folder Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateFolderName", () => {
    it("should accept valid folder names", () => {
      expect(() => validateFolderName("My Folder")).not.toThrow();
      expect(() => validateFolderName("folder-123")).not.toThrow();
      expect(() => validateFolderName("Folder_Name")).not.toThrow();
      expect(() => validateFolderName("A")).not.toThrow(); // Min length
      expect(() => validateFolderName("A".repeat(255))).not.toThrow(); // Max length
    });

    it("should reject empty folder names", () => {
      expect(() => validateFolderName("")).toThrow("Folder name is required");
      expect(() => validateFolderName("   ")).toThrow("Folder name must be at least 1 character");
    });

    it("should reject folder names that are too short", () => {
      expect(() => validateFolderName("")).toThrow();
    });

    it("should reject folder names that are too long", () => {
      const longName = "A".repeat(256);
      expect(() => validateFolderName(longName)).toThrow(
        `Folder name must be no more than ${MAX_FOLDER_NAME_LENGTH} characters`
      );
    });

    it("should reject folder names with invalid characters", () => {
      expect(() => validateFolderName("Folder@Name")).toThrow(
        "Folder name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
      expect(() => validateFolderName("Folder#Name")).toThrow(
        "Folder name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
      expect(() => validateFolderName("Folder$Name")).toThrow(
        "Folder name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
      expect(() => validateFolderName("Folder/Name")).toThrow(
        "Folder name can only contain letters, numbers, spaces, hyphens, and underscores"
      );
    });

    it("should accept folder names with allowed special characters", () => {
      expect(() => validateFolderName("My-Folder")).not.toThrow();
      expect(() => validateFolderName("My_Folder")).not.toThrow();
      expect(() => validateFolderName("My Folder 123")).not.toThrow();
    });
  });

  describe("validateFolderNameUniqueness", () => {
    it("should accept unique folder names", async () => {
      (prisma.assetFolder.findFirst as any).mockResolvedValue(null);

      await expect(validateFolderNameUniqueness("New Folder", null, "workspace-1")).resolves.not.toThrow();
    });

    it("should reject duplicate folder names in the same parent", async () => {
      (prisma.assetFolder.findFirst as any).mockResolvedValue({
        id: "existing-folder",
        name: "Existing Folder",
      });

      await expect(validateFolderNameUniqueness("Existing Folder", null, "workspace-1")).rejects.toThrow(
        "A folder with this name already exists in this location"
      );
    });

    it("should allow duplicate names in different parents", async () => {
      // When checking in parent-2, should not find existing folder from parent-1
      (prisma.assetFolder.findFirst as any).mockResolvedValue(null);

      // Should not throw when checking different parent
      await expect(validateFolderNameUniqueness("Folder", "parent-2", "workspace-1")).resolves.not.toThrow();
    });

    it("should handle null workspaceId (admin context)", async () => {
      (prisma.assetFolder.findFirst as any).mockResolvedValue(null);

      await expect(validateFolderNameUniqueness("Folder", null, null)).resolves.not.toThrow();
    });
  });
});
