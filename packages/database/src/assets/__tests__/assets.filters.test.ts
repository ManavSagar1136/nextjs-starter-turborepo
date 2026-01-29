import { describe, it, expect } from "vitest";
import { buildAssetFilter, buildMongoMetadataFilter, convertWhereToMongoExpr } from "../assets.filters";

describe("buildAssetFilter", () => {
  it("should return empty object when no workspace or filters provided", () => {
    const result = buildAssetFilter(undefined);
    expect(result).toEqual({});
  });

  it("should include workspaceId when provided", () => {
    const result = buildAssetFilter("workspace123");
    expect(result).toEqual({ workspaceId: "workspace123" });
  });

  it("should include folderId when provided", () => {
    const result = buildAssetFilter("workspace123", { folderId: "folder456" });
    expect(result.folderId).toBe("folder456");
  });

  it("should include null folderId for root assets", () => {
    const result = buildAssetFilter("workspace123", { folderId: null });
    expect(result.folderId).toBeNull();
  });

  it("should include isPublic filter", () => {
    const result = buildAssetFilter("workspace123", { isPublic: true });
    expect(result.isPublic).toBe(true);
  });

  it("should build search OR conditions", () => {
    const result = buildAssetFilter("workspace123", { search: "image" });
    expect(result.OR).toBeDefined();
    expect(Array.isArray(result.OR)).toBe(true);
    expect((result.OR as unknown[]).length).toBe(3); // filename, tags, folder
  });

  it("should handle single content type", () => {
    const result = buildAssetFilter("workspace123", { contentType: "image/png" });
    expect(result.contentType).toBe("image/png");
  });

  it("should handle wildcard content type", () => {
    const result = buildAssetFilter("workspace123", { contentType: "image/*" });
    expect(result.contentType).toEqual({
      startsWith: "image",
      mode: "insensitive",
    });
  });

  it("should handle multiple content types", () => {
    const result = buildAssetFilter("workspace123", { contentType: "image/png,image/jpeg" });
    expect(result.OR).toBeDefined();
    expect(Array.isArray(result.OR)).toBe(true);
  });

  it("should handle tagIds filter", () => {
    const result = buildAssetFilter("workspace123", { tagIds: ["tag1", "tag2"] });
    expect(result.assetTags).toEqual({
      some: {
        tagId: { in: ["tag1", "tag2"] },
      },
    });
  });
});

describe("buildMongoMetadataFilter", () => {
  it("should return null when no filters provided", () => {
    const result = buildMongoMetadataFilter();
    expect(result).toBeNull();
  });

  it("should return null for empty filters", () => {
    const result = buildMongoMetadataFilter({});
    expect(result).toBeNull();
  });

  it("should handle exactWidth", () => {
    const result = buildMongoMetadataFilter({ exactWidth: 1920 });
    expect(result).toEqual({ "metadata.width": 1920 });
  });

  it("should handle width range", () => {
    const result = buildMongoMetadataFilter({ minWidth: 100, maxWidth: 500 });
    expect(result).toEqual({
      "metadata.width": { $gte: 100, $lte: 500 },
    });
  });

  it("should handle height filters", () => {
    const result = buildMongoMetadataFilter({ minHeight: 200, maxHeight: 800 });
    expect(result).toEqual({
      "metadata.height": { $gte: 200, $lte: 800 },
    });
  });

  it("should handle aspect ratio filter", () => {
    const result = buildMongoMetadataFilter({ allowedAspectRatios: ["16:9"] });
    expect(result?.$or).toBeDefined();
    expect(Array.isArray(result?.$or)).toBe(true);
  });
});

describe("convertWhereToMongoExpr", () => {
  it("should return null for empty conditions", () => {
    const result = convertWhereToMongoExpr({});
    expect(result).toBeNull();
  });

  it("should convert workspaceId with $toObjectId", () => {
    const result = convertWhereToMongoExpr({
      workspaceId: "507f1f77bcf86cd799439011",
    });
    expect(result).toEqual({
      $expr: {
        $and: [{ $eq: ["$workspaceId", { $toObjectId: "507f1f77bcf86cd799439011" }] }],
      },
    });
  });

  it("should handle isPublic filter", () => {
    const result = convertWhereToMongoExpr({ isPublic: true });
    expect(result?.$expr?.$and).toContainEqual({ $eq: ["$isPublic", true] });
  });

  it("should combine with metadata filter", () => {
    const metadataFilter = { "metadata.width": { $gte: 100 } };
    const result = convertWhereToMongoExpr({ isPublic: true }, metadataFilter);
    expect(result?.$expr?.$and).toBeDefined();
    expect((result?.$expr?.$and as unknown[]).length).toBeGreaterThan(1);
  });
});
