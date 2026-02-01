import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MediaLibraryProvider, useMediaLibrary, useAssetQueryParams } from "../context";
import type { IMediaLibraryApi, IAsset, IPaginationResponse } from "../types";

// Mock API implementation
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

// Test component for query params
function QueryParamsConsumer() {
  const queryParams = useAssetQueryParams();

  return (
    <div>
      <span data-testid="page">{queryParams.$page}</span>
      <span data-testid="limit">{queryParams.$limit}</span>
      <span data-testid="search">{queryParams.search || "none"}</span>
    </div>
  );
}

describe("MediaLibraryProvider", () => {
  const mockApi = createMockApi();
  const mockAssets: IPaginationResponse<IAsset> = {
    docs: [],
    totalDocs: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };

  it("should render children without crashing", () => {
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
        <div data-testid="child">Child component</div>
      </MediaLibraryProvider>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Child component");
  });
});

describe("useAssetQueryParams", () => {
  const mockApi = createMockApi();
  const mockAssets: IPaginationResponse<IAsset> = {
    docs: [],
    totalDocs: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };

  it("should return default query params", () => {
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
        <QueryParamsConsumer />
      </MediaLibraryProvider>
    );

    expect(screen.getByTestId("page")).toHaveTextContent("1");
    expect(screen.getByTestId("limit")).toHaveTextContent("20");
    expect(screen.getByTestId("search")).toHaveTextContent("none");
  });
});

describe("useMediaLibrary hook", () => {
  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function TestComponent() {
      useMediaLibrary();
      return null;
    }

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useMediaLibrary must be used within a MediaLibraryProvider");

    consoleSpy.mockRestore();
  });
});
