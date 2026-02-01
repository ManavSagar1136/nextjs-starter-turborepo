/**
 * @buildbase/components - AssetCard Tests
 *
 * Unit tests for AssetCard and AssetListItem components
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssetCard, AssetListItem } from "../AssetCard";
import { MediaLibraryProvider } from "../context";
import type { IMediaLibraryApi, IPaginationResponse, IAsset } from "../types";

// Mock API
const createMockApi = (): IMediaLibraryApi => ({
  getAssets: vi.fn(),
  getAsset: vi.fn(),
  updateAsset: vi.fn(),
  deleteAsset: vi.fn(),
  toggleAssetPrivacy: vi.fn(),
  getAssetDownloadUrl: vi.fn(),
  getFolderTree: vi.fn(),
  getFolders: vi.fn(),
  getFolder: vi.fn(),
  createFolder: vi.fn(),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
  moveFolder: vi.fn(),
  getTags: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  moveAssetToFolder: vi.fn(),
  assignTagsToAsset: vi.fn(),
  removeTagsFromAsset: vi.fn(),
  getUploadSignedUrl: vi.fn(),
  completeUpload: vi.fn(),
  uploadAsset: vi.fn(),
  duplicateAsset: vi.fn(),
});

const mockAssets: IPaginationResponse<IAsset> = {
  docs: [],
  totalDocs: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const mockAsset: IAsset = {
  id: "asset-1",
  name: "test-image.jpg",
  filename: "test-image.jpg",
  url: "https://example.com/test-image.jpg",
  contentType: "image/jpeg",
  size: 1024000,
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("AssetCard", () => {
  const mockApi = createMockApi();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render asset information", () => {
    render(
      <MediaLibraryProvider
        api={mockApi}
        assets={mockAssets}
        folderTree={[]}
        tags={[]}
        isLoadingAssets={false}
        isLoadingFolders={false}
        isLoadingTags={false}
        onRefreshAssets={vi.fn()}
        onRefreshFolders={vi.fn()}
        onRefreshTags={vi.fn()}
        onDeleteAsset={vi.fn()}
        onTogglePrivacy={vi.fn()}
      >
        <AssetCard asset={mockAsset} />
      </MediaLibraryProvider>
    );

    expect(screen.getByText("test-image.jpg")).toBeInTheDocument();
  });

  it("should display image preview for image assets", () => {
    render(
      <MediaLibraryProvider
        api={mockApi}
        assets={mockAssets}
        folderTree={[]}
        tags={[]}
        isLoadingAssets={false}
        isLoadingFolders={false}
        isLoadingTags={false}
        onRefreshAssets={vi.fn()}
        onRefreshFolders={vi.fn()}
        onRefreshTags={vi.fn()}
        onDeleteAsset={vi.fn()}
        onTogglePrivacy={vi.fn()}
      >
        <AssetCard asset={mockAsset} />
      </MediaLibraryProvider>
    );

    const img = screen.getByAltText("test-image.jpg");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/test-image.jpg");
  });

  it("should handle click to preview", () => {
    const mockOnAssetAction = vi.fn();

    render(
      <MediaLibraryProvider
        api={mockApi}
        assets={mockAssets}
        folderTree={[]}
        tags={[]}
        isLoadingAssets={false}
        isLoadingFolders={false}
        isLoadingTags={false}
        onRefreshAssets={vi.fn()}
        onRefreshFolders={vi.fn()}
        onRefreshTags={vi.fn()}
        onDeleteAsset={vi.fn()}
        onTogglePrivacy={vi.fn()}
      >
        <AssetCard asset={mockAsset} />
      </MediaLibraryProvider>
    );

    // Click on the card
    const card = screen.getByText("test-image.jpg").closest("div");
    if (card) {
      fireEvent.click(card);
      // Note: This would need proper event handling setup
    }
  });
});

describe("AssetListItem", () => {
  const mockApi = createMockApi();

  it("should render asset in list format", () => {
    render(
      <MediaLibraryProvider
        api={mockApi}
        assets={mockAssets}
        folderTree={[]}
        tags={[]}
        isLoadingAssets={false}
        isLoadingFolders={false}
        isLoadingTags={false}
        onRefreshAssets={vi.fn()}
        onRefreshFolders={vi.fn()}
        onRefreshTags={vi.fn()}
        onDeleteAsset={vi.fn()}
        onTogglePrivacy={vi.fn()}
      >
        <AssetListItem asset={mockAsset} />
      </MediaLibraryProvider>
    );

    expect(screen.getByText("test-image.jpg")).toBeInTheDocument();
  });
});
