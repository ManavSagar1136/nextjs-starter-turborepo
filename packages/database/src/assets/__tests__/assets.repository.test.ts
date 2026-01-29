import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AssetsRepository } from "../assets.repository";
import { prisma } from "../../index";

// Mock prisma client
vi.mock("../../index", () => ({
  prisma: {
    asset: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    assetTag: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(cb => cb(prisma)),
    $runCommandRaw: vi.fn(),
  },
}));

describe("AssetsRepository", () => {
  const mockWorkspaceId = "workspace-123";
  const mockUserId = "user-456";
  const mockAssetId = "asset-789";

  const mockAsset = {
    id: mockAssetId,
    filename: "test-image.png",
    path: "workspace-123/abc123.png",
    url: "https://storage.example.com/workspace-123/abc123.png",
    size: 1024000,
    contentType: "image/png",
    bucket: "test-bucket",
    isPublic: false,
    folderId: null,
    workspaceId: mockWorkspaceId,
    userId: mockUserId,
    metadata: { width: 1920, height: 1080 },
    createdAt: new Date("2024-01-29T10:00:00Z"),
    updatedAt: new Date("2024-01-29T10:00:00Z"),
    folder: null,
    assetTags: [],
    user: { id: mockUserId, name: "Test User" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("findById", () => {
    it("should return asset when found", async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset);

      const result = await AssetsRepository.findById(mockAssetId, mockWorkspaceId);

      expect(prisma.asset.findFirst).toHaveBeenCalledWith({
        where: { id: mockAssetId, workspaceId: mockWorkspaceId },
      });
      expect(result).toEqual(mockAsset);
    });

    it("should return null when asset not found", async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(null);

      const result = await AssetsRepository.findById("nonexistent", mockWorkspaceId);

      expect(result).toBeNull();
    });

    it("should work without workspaceId for admin access", async () => {
      vi.mocked(prisma.asset.findFirst).mockResolvedValue(mockAsset);

      await AssetsRepository.findById(mockAssetId);

      expect(prisma.asset.findFirst).toHaveBeenCalledWith({
        where: { id: mockAssetId },
      });
    });
  });

  describe("create", () => {
    it("should create asset with required fields", async () => {
      const createData = {
        filename: "new-image.jpg",
        path: "workspace-123/new.jpg",
        url: "https://storage.example.com/workspace-123/new.jpg",
        size: 512000,
        contentType: "image/jpeg",
        bucket: "test-bucket",
        isPublic: false,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
      };

      vi.mocked(prisma.asset.create).mockResolvedValue({
        ...mockAsset,
        ...createData,
        id: "new-asset-id",
      });

      const result = await AssetsRepository.create(createData);

      expect(prisma.asset.create).toHaveBeenCalled();
      expect(result.filename).toBe(createData.filename);
    });

    it("should create asset with folderId", async () => {
      const createData = {
        filename: "new-image.jpg",
        path: "workspace-123/new.jpg",
        url: "https://storage.example.com/workspace-123/new.jpg",
        size: 512000,
        contentType: "image/jpeg",
        bucket: "test-bucket",
        isPublic: false,
        workspaceId: mockWorkspaceId,
        userId: mockUserId,
        folderId: "folder-123",
      };

      vi.mocked(prisma.asset.create).mockResolvedValue({
        ...mockAsset,
        ...createData,
      });

      const result = await AssetsRepository.create(createData);

      expect(prisma.asset.create).toHaveBeenCalled();
      const createCall = vi.mocked(prisma.asset.create).mock.calls[0][0];
      expect(createCall.data.folderId).toBe("folder-123");
    });
  });

  describe("update", () => {
    it("should update asset filename", async () => {
      vi.mocked(prisma.asset.update).mockResolvedValue({
        ...mockAsset,
        filename: "renamed.png",
      });

      const result = await AssetsRepository.update(mockAssetId, {
        filename: "renamed.png",
      });

      expect(prisma.asset.update).toHaveBeenCalled();
      expect(result.filename).toBe("renamed.png");
    });

    it("should update asset folder", async () => {
      vi.mocked(prisma.asset.update).mockResolvedValue({
        ...mockAsset,
        folderId: "new-folder",
      });

      const result = await AssetsRepository.update(mockAssetId, { folderId: "new-folder" });

      expect(prisma.asset.update).toHaveBeenCalled();
      expect(result.folderId).toBe("new-folder");
    });

    it("should update asset privacy", async () => {
      vi.mocked(prisma.asset.update).mockResolvedValue({
        ...mockAsset,
        isPublic: true,
      });

      const result = await AssetsRepository.update(mockAssetId, { isPublic: true });

      expect(result.isPublic).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete asset by id", async () => {
      vi.mocked(prisma.asset.delete).mockResolvedValue(mockAsset);

      await AssetsRepository.delete(mockAssetId);

      expect(prisma.asset.delete).toHaveBeenCalledWith({
        where: { id: mockAssetId },
      });
    });
  });

  describe("countByWorkspace", () => {
    it("should return count for workspace", async () => {
      vi.mocked(prisma.asset.count).mockResolvedValue(10);

      const result = await AssetsRepository.countByWorkspace(mockWorkspaceId);

      expect(prisma.asset.count).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
      });
      expect(result).toBe(10);
    });

    it("should return zero when no assets", async () => {
      vi.mocked(prisma.asset.count).mockResolvedValue(0);

      const result = await AssetsRepository.countByWorkspace(mockWorkspaceId);

      expect(result).toBe(0);
    });
  });

  describe("sumStorageByWorkspace", () => {
    it("should return total storage for workspace", async () => {
      vi.mocked(prisma.asset.aggregate).mockResolvedValue({
        _sum: { size: 5000000 },
      } as never);

      const result = await AssetsRepository.sumStorageByWorkspace(mockWorkspaceId);

      expect(prisma.asset.aggregate).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
        _sum: { size: true },
      });
      expect(result).toBe(5000000);
    });

    it("should return zero when no assets", async () => {
      vi.mocked(prisma.asset.aggregate).mockResolvedValue({
        _sum: { size: null },
      } as never);

      const result = await AssetsRepository.sumStorageByWorkspace(mockWorkspaceId);

      expect(result).toBe(0);
    });
  });

  describe("findByFolder", () => {
    it("should find assets in a specific folder", async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([mockAsset]);

      const result = await AssetsRepository.findByFolder("folder-123", mockWorkspaceId);

      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: { folderId: "folder-123", workspaceId: mockWorkspaceId },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });

    it("should find assets in root (null folder)", async () => {
      vi.mocked(prisma.asset.findMany).mockResolvedValue([mockAsset]);

      const result = await AssetsRepository.findByFolder(null, mockWorkspaceId);

      expect(prisma.asset.findMany).toHaveBeenCalledWith({
        where: { folderId: null, workspaceId: mockWorkspaceId },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("moveToFolder", () => {
    it("should move asset to a folder", async () => {
      vi.mocked(prisma.asset.update).mockResolvedValue({
        ...mockAsset,
        folderId: "new-folder",
      });

      const result = await AssetsRepository.moveToFolder(mockAssetId, "new-folder");

      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: mockAssetId },
        data: { folderId: "new-folder" },
      });
      expect(result.folderId).toBe("new-folder");
    });

    it("should move asset to root (null folder)", async () => {
      vi.mocked(prisma.asset.update).mockResolvedValue({
        ...mockAsset,
        folderId: null,
      });

      const result = await AssetsRepository.moveToFolder(mockAssetId, null);

      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: mockAssetId },
        data: { folderId: null },
      });
      expect(result.folderId).toBeNull();
    });
  });

  describe("addTags", () => {
    it("should add tags to asset", async () => {
      vi.mocked(prisma.assetTag.upsert).mockResolvedValue({
        assetId: mockAssetId,
        tagId: "tag-1",
      } as never);

      await AssetsRepository.addTags(mockAssetId, ["tag-1", "tag-2"]);

      expect(prisma.assetTag.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe("removeTags", () => {
    it("should remove tags from asset", async () => {
      vi.mocked(prisma.assetTag.deleteMany).mockResolvedValue({ count: 2 });

      await AssetsRepository.removeTags(mockAssetId, ["tag-1", "tag-2"]);

      expect(prisma.assetTag.deleteMany).toHaveBeenCalledWith({
        where: {
          assetId: mockAssetId,
          tagId: { in: ["tag-1", "tag-2"] },
        },
      });
    });
  });

  describe("setTags", () => {
    it("should clear all tags when empty array provided", async () => {
      vi.mocked(prisma.assetTag.deleteMany).mockResolvedValue({ count: 2 });

      await AssetsRepository.setTags(mockAssetId, []);

      expect(prisma.assetTag.deleteMany).toHaveBeenCalled();
    });
  });
});
