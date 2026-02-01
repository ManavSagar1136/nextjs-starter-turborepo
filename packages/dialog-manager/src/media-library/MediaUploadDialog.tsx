"use client";

import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, File, Folder, Loader2, Upload, X } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";

import type { MediaUploadDialogProps, UploadedFile } from "./types";

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

interface FileItemProps {
  file: UploadedFile;
  onRemove?: (id: string) => void;
  disabled?: boolean;
}

function FileItem({ file, onRemove, disabled }: FileItemProps) {
  return (
    <div className="bg-background flex items-center gap-3 rounded-lg border p-3">
      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded">
        <File className="text-muted-foreground h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.file.name}</p>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>{formatFileSize(file.file.size)}</span>
          {file.status === "uploading" && (
            <>
              <span>•</span>
              <span>{file.progress}%</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {file.status === "uploading" && (
          <div className="bg-muted mt-2 h-1 w-full overflow-hidden rounded-full">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
          </div>
        )}

        {/* Error message */}
        {file.status === "error" && file.error && <p className="text-destructive mt-1 text-xs">{file.error}</p>}
      </div>

      {/* Status indicator */}
      <div className="shrink-0">
        {file.status === "pending" && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onRemove(file.id)}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {file.status === "uploading" && <Loader2 className="text-primary h-5 w-5 animate-spin" />}
        {file.status === "completed" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {file.status === "error" && <AlertCircle className="text-destructive h-5 w-5" />}
      </div>
    </div>
  );
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  isUploading = false,
  acceptedTypes,
  maxFileSize,
  maxFiles = 10,
  files = [],
  onFilesSelected,
  onUpload,
  onRemoveFile,
  onComplete,
}: MediaUploadDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  // Handle file selection
  const handleFiles = useCallback(
    (selectedFiles: FileList | File[]) => {
      const fileArray = Array.from(selectedFiles);

      // Filter by type if specified
      let filtered = fileArray;
      if (acceptedTypes) {
        const types = acceptedTypes.split(",").map(t => t.trim());
        filtered = fileArray.filter(file =>
          types.some(type => {
            if (type.endsWith("/*")) {
              return file.type.startsWith(type.replace("/*", ""));
            }
            return file.type === type;
          })
        );
      }

      // Filter by size if specified
      if (maxFileSize) {
        filtered = filtered.filter(file => file.size <= maxFileSize);
      }

      // Limit number of files
      filtered = filtered.slice(0, maxFiles);

      if (onFilesSelected) {
        onFilesSelected(filtered);
      } else {
        setLocalFiles(prev => [...prev, ...filtered].slice(0, maxFiles));
      }
    },
    [acceptedTypes, maxFileSize, maxFiles, onFilesSelected]
  );

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // Handle upload
  const handleUpload = async () => {
    const filesToUpload = files.length > 0 ? files.map(f => f.file) : localFiles;
    if (filesToUpload.length === 0) return;

    await onUpload(filesToUpload);
    setLocalFiles([]);
  };

  // Handle remove local file
  const handleRemoveLocalFile = (index: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const displayFiles =
    files.length > 0
      ? files
      : localFiles.map((file, i) => ({
          id: `local-${i}`,
          file,
          status: "pending" as const,
          progress: 0,
        }));

  const canUpload = displayFiles.length > 0 && !isUploading;
  const allCompleted = files.length > 0 && files.every(f => f.status === "completed");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload files to your media library
            {folderName && (
              <>
                {" "}
                in <span className="font-medium">{folderName}</span>
              </>
            )}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Folder indicator */}
          {folderId && folderName && (
            <div className="bg-muted/50 flex items-center gap-2 rounded-md p-2 text-sm">
              <Folder className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">Uploading to:</span>
              <span className="font-medium">{folderName}</span>
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
            } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept={acceptedTypes}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={e => e.target.files && handleFiles(e.target.files)}
              disabled={isUploading}
            />
            <Upload className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
            <p className="text-sm font-medium">Drag and drop files here</p>
            <p className="text-muted-foreground mt-1 text-xs">or click to browse</p>
            {maxFileSize && (
              <p className="text-muted-foreground mt-2 text-xs">Max file size: {formatFileSize(maxFileSize)}</p>
            )}
          </div>

          {/* File list */}
          {displayFiles.length > 0 && (
            <div className="max-h-[200px] space-y-2 overflow-y-auto">
              {displayFiles.map((file, index) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onRemove={files.length === 0 ? () => handleRemoveLocalFile(index) : onRemoveFile}
                  disabled={isUploading}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (allCompleted && onComplete) {
                onComplete();
              }
              onOpenChange(false);
            }}
            disabled={isUploading && !allCompleted}
          >
            {allCompleted ? "Done" : "Cancel"}
          </Button>
          {!allCompleted && (
            <Button onClick={handleUpload} disabled={!canUpload}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {displayFiles.length > 0 && `(${displayFiles.length})`}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
