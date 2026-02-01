"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";
import { Image, Plus, Trash2, Eye, Download, Search, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@buildbase/ui/components/ui/table";
import { Badge } from "@buildbase/ui/components/ui/badge";
import { Input } from "@buildbase/ui/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@buildbase/ui/components/ui/sheet";
import { useDialogManager, MEDIA_LIBRARY_DIALOG_KEYS } from "@buildbase/dialog-manager";
import type { UploadedFile } from "@buildbase/dialog-manager/media-library";
import { API } from "@/services";
import type { Asset } from "@/services/assets";

const AssetsPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const { openDialog } = useDialogManager();

  const fetchAssets = async (page: number = 1, search?: string) => {
    try {
      setIsLoading(true);
      const data = await API.assets.list({
        page,
        limit: 20,
        search: search || undefined,
      });
      setAssets(data.docs || []);
      setTotalPages(data.totalPages || 1);
      setTotalDocs(data.totalDocs || 0);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets(currentPage, searchQuery);
  }, [refreshCounter, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAssets(1, searchQuery);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      await API.assets.remove(id);
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Failed to delete asset:", error);
      alert("Failed to delete asset. Please try again.");
    }
  };

  const handlePreview = async (asset: Asset) => {
    try {
      const fullAsset = await API.assets.getById(asset.id);
      setPreviewAsset(fullAsset);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Failed to fetch asset for preview:", error);
    }
  };

  const handleDownload = (asset: Asset) => {
    if (asset.url) {
      window.open(asset.url, "_blank");
    } else {
      alert("Download URL not available for this asset");
    }
  };

  // Handle file selection - initialize upload files state
  const handleFilesSelected = (files: File[]) => {
    const uploadedFiles: UploadedFile[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      status: "pending",
      progress: 0,
    }));
    setUploadFiles(uploadedFiles);
  };

  // Handle file removal
  const handleFileRemove = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload file with progress tracking
  const uploadFileWithProgress = async (
    file: File,
    fileId: string,
    onProgress: (progress: number) => void,
    onStatusChange: (status: "uploading" | "completed" | "error", error?: string) => void
  ): Promise<{ success: boolean; error?: string; result?: { id: string; url: string; path: string } }> => {
    try {
      // Step 1: Get signed upload URL
      onStatusChange("uploading");
      onProgress(10);

      const uploadResponse = await fetch("/api/assets/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get upload URL");
      }

      const { data: uploadData } = await uploadResponse.json();
      const { url: signedUrl, path } = uploadData;
      onProgress(20);

      // Step 2: Upload directly to storage with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", e => {
          if (e.lengthComputable) {
            // Progress from 20% to 80% (uploading to storage)
            const uploadProgress = 20 + (e.loaded / e.total) * 60;
            onProgress(Math.round(uploadProgress));
          }
        });

        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(80);

            try {
              // Step 3: Complete upload (create asset record)
              const completeResponse = await fetch("/api/assets/upload/complete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  path,
                  filename: file.name,
                  contentType: file.type,
                  size: file.size,
                  makePublic: false,
                }),
              });

              if (!completeResponse.ok) {
                const errorData = await completeResponse.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to complete upload");
              }

              const { data: completeData } = await completeResponse.json();
              onProgress(100);
              onStatusChange("completed");

              resolve({
                success: true,
                result: {
                  id: completeData.id,
                  url: completeData.url,
                  path: completeData.path,
                },
              });
            } catch (error) {
              onStatusChange("error", error instanceof Error ? error.message : "Failed to complete upload");
              reject(error);
            }
          } else {
            onStatusChange("error", `Upload failed with status ${xhr.status}`);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          onStatusChange("error", "Network error during upload");
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          onStatusChange("error", "Upload aborted");
          reject(new Error("Upload aborted"));
        });

        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    } catch (error) {
      onStatusChange("error", error instanceof Error ? error.message : "Unknown error");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const handleOpenUploadDialog = () => {
    // Reset upload files when opening dialog
    setUploadFiles([]);

    openDialog(MEDIA_LIBRARY_DIALOG_KEYS.MEDIA_UPLOAD, {
      isUploading: uploadFiles.some(f => f.status === "uploading"),
      acceptedTypes: "image/*,video/*,audio/*,application/pdf,application/*,text/*",
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
      files: uploadFiles,
      onFilesSelected: handleFilesSelected,
      onRemoveFile: handleFileRemove,
      onUpload: handleUpload,
      onComplete: handleUploadComplete,
    } as any);
  };

  const handleUpload = async (files: File[]) => {
    // If files were just selected, initialize upload files state
    if (uploadFiles.length === 0 && files.length > 0) {
      const initialFiles: UploadedFile[] = files.map((file, index) => ({
        id: `upload-${Date.now()}-${index}`,
        file,
        status: "pending",
        progress: 0,
      }));
      setUploadFiles(initialFiles);

      // Start uploading immediately
      await uploadFilesToStorage(initialFiles);
      return;
    }

    // If upload files already exist, start uploading
    if (uploadFiles.length > 0) {
      await uploadFilesToStorage(uploadFiles);
    }
  };

  const uploadFilesToStorage = async (filesToUpload: UploadedFile[]) => {
    // Upload all files with progress tracking
    const uploadPromises = filesToUpload.map(async uploadedFile => {
      const file = uploadedFile.file;
      const fileId = uploadedFile.id;

      return uploadFileWithProgress(
        file,
        fileId,
        progress => {
          // Update progress for this file
          setUploadFiles(prev =>
            prev.map(f => (f.id === fileId ? { ...f, progress, status: "uploading" as const } : f))
          );
        },
        (status, error) => {
          // Update status for this file
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? {
                    ...f,
                    status,
                    progress: status === "completed" ? 100 : f.progress,
                    error,
                  }
                : f
            )
          );
        }
      ).then(result => {
        if (result.success && result.result) {
          // Update file with result
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === fileId ? { ...f, result: result.result, status: "completed" as const, progress: 100 } : f
            )
          );
        }
        return result;
      });
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        console.error(
          "Some uploads failed:",
          results.filter(r => !r.success)
        );
      }

      // Refresh assets list if any uploads succeeded
      if (successful > 0) {
        setRefreshCounter(prev => prev + 1);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleUploadComplete = () => {
    setUploadFiles([]);
    setRefreshCounter(prev => prev + 1);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getContentTypeBadge = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return <Badge variant="default">Image</Badge>;
    }
    if (contentType.startsWith("video/")) {
      return <Badge variant="secondary">Video</Badge>;
    }
    if (contentType.startsWith("audio/")) {
      return <Badge variant="outline">Audio</Badge>;
    }
    if (contentType.includes("pdf")) {
      return <Badge variant="destructive">PDF</Badge>;
    }
    return <Badge variant="outline">{contentType.split("/")[0]}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Image className="h-5 w-5" />
              Assets
            </h1>
            <p className="text-muted-foreground mt-1">Manage and organize your assets</p>
          </div>
          <Button onClick={handleOpenUploadDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Asset
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search assets by filename..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No assets found. Upload your first asset to get started.
          </div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map(asset => (
                    <TableRow key={asset.id}>
                      <TableCell className="max-w-xs truncate font-medium" title={asset.filename}>
                        {asset.filename}
                      </TableCell>
                      <TableCell>{getContentTypeBadge(asset.contentType)}</TableCell>
                      <TableCell>{formatFileSize(asset.size)}</TableCell>
                      <TableCell>
                        <Badge variant={asset.isPublic ? "default" : "secondary"}>
                          {asset.isPublic ? "Public" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asset.workspace ? (
                          <span className="text-sm">{asset.workspace.name || asset.workspace.id}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.user ? (
                          <span className="text-sm">{asset.user.name || asset.user.email || "-"}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.createdAt && (
                          <span title={new Date(asset.createdAt).toLocaleString()} className="text-sm">
                            {new Date(asset.createdAt).toLocaleDateString()}{" "}
                            {new Date(asset.createdAt).toLocaleTimeString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handlePreview(asset)} title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button variant="ghost" size="sm" onClick={() => handleDownload(asset)} title="Download">
                            <Download className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  Showing {assets.length} of {totalDocs} assets
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl lg:max-w-4xl">
          <SheetHeader>
            <SheetTitle>{previewAsset?.filename || "Asset Preview"}</SheetTitle>
            <SheetDescription>
              {previewAsset && (
                <>
                  {previewAsset.contentType} • {formatFileSize(previewAsset.size)}
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {previewAsset && (
              <>
                {/* Image Preview */}
                {previewAsset.contentType.startsWith("image/") && previewAsset.url && (
                  <div className="space-y-2">
                    <div className="bg-muted/50 rounded-md border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-medium">Image Preview</div>
                        <Badge variant="outline" className="text-xs">
                          {previewAsset.contentType}
                        </Badge>
                      </div>
                      <div className="rounded border bg-white p-4 shadow-sm">
                        <img
                          src={previewAsset.url}
                          alt={previewAsset.filename}
                          className="max-h-[70vh] w-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Asset Details */}
                <div className="space-y-2">
                  <div className="bg-muted/50 rounded-md border p-4">
                    <div className="mb-4 text-sm font-medium">Asset Details</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Filename:</span>
                        <span className="font-medium">{previewAsset.filename}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{formatFileSize(previewAsset.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Content Type:</span>
                        <span className="font-medium">{previewAsset.contentType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={previewAsset.isPublic ? "default" : "secondary"}>
                          {previewAsset.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      {previewAsset.workspace && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Workspace:</span>
                          <span className="font-medium">
                            {previewAsset.workspace.name || previewAsset.workspace.id}
                          </span>
                        </div>
                      )}
                      {previewAsset.user && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uploaded By:</span>
                          <span className="font-medium">
                            {previewAsset.user.name || previewAsset.user.email || "-"}
                          </span>
                        </div>
                      )}
                      {previewAsset.folder && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Folder:</span>
                          <span className="font-medium">{previewAsset.folder.name}</span>
                        </div>
                      )}
                      {previewAsset.tags && previewAsset.tags.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {previewAsset.tags.map(tag => (
                              <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color || undefined }}>
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">{new Date(previewAsset.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="font-medium">{new Date(previewAsset.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Link */}
                {previewAsset.url && (
                  <div className="flex justify-end">
                    <Button onClick={() => handleDownload(previewAsset)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Asset
                    </Button>
                  </div>
                )}

                {/* Non-image preview message */}
                {!previewAsset.contentType.startsWith("image/") && (
                  <div className="text-muted-foreground py-8 text-center">
                    Preview not available for this file type. Click download to view the file.
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AssetsPage;
