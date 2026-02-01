/**
 * @buildbase/database - Bulk Operations Tests
 *
 * Unit tests for bulk asset operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { bulkDeleteAssets, bulkMoveAssets, bulkAssignTags, bulkRemoveTags } from "../bulk-operations";
import { AssetsRepository } from "../../assets/assets.repository";
import { prisma } from "../../index";

// Mock dependencies
vi.mock("../../assets/assets.repository");
vi.mock("../../index", () => ({
  prisma: {
    asset: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    assetFolder: {
      findFirst: vi.fn(),
    },
    mediaTag: {
      findMany: vi.fn(),
    },
    assetTag: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe("Bulk Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("bulkDeleteAssets", () => {
    it("should validate bulk operation size limit", async () => {
      const assetIds = Array.from({ length: 101 }, (_, i) => `asset-${i}`);

      await expect(bulkDeleteAssets(assetIds, "workspace-1")).rejects.toThrow(
        "Maximum 100 assets per bulk operation allowed"
      );
    });

    it("should require at least one asset ID", async () => {
      await expect(bulkDeleteAssets([], "workspace-1")).rejects.toThrow("At least one asset ID is required");
    });

    it("should return success and failure counts", async () => {
      const assetIds = ["asset-1", "asset-2"];
      (prisma.asset.findMany as any).mockResolvedValue([{ id: "asset-1" }, { id: "asset-2" }]);
      (AssetsRepository.delete as any) = vi.fn().mockResolvedValue(undefined);

      const result = await bulkDeleteAssets(assetIds, "workspace-1");

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });
  });

  describe("bulkMoveAssets", () => {
    it("should validate folder exists", async () => {
      const assetIds = ["asset-1"];
      (prisma.asset.findMany as any).mockResolvedValue([{ id: "asset-1" }]);
      (prisma.assetFolder.findFirst as any).mockResolvedValue(null);

      await expect(bulkMoveAssets(assetIds, "folder-1", "workspace-1")).rejects.toThrow(
        "Folder not found or does not belong to workspace"
      );
    });
  });

  describe("bulkAssignTags", () => {
    it("should validate tag limit per asset", async () => {
      const assetIds = ["asset-1"];
      const tagIds = Array.from({ length: 21 }, (_, i) => `tag-${i}`);

      (prisma.asset.findMany as any).mockResolvedValue([{ id: "asset-1" }]);
      (prisma.mediaTag.findMany as any).mockResolvedValue(tagIds.map(id => ({ id })));
      (AssetsRepository.findByIdAdmin as any) = vi.fn().mockResolvedValue({ id: "asset-1" });
      (prisma.assetTag.findMany as any).mockResolvedValue([]);

      const result = await bulkAssignTags(assetIds, tagIds, "workspace-1");

      expect(result.failureCount).toBeGreaterThan(0);
      expect(result.errors[0]?.error).toContain("Maximum 20 tags per asset");
    });
  });
});
