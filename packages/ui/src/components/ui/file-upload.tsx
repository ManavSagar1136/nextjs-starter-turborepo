import * as React from "react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";

export interface FileUploadProps {
  onFileSelect?: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  acceptedFileTypes?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  files?: File[];
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  acceptedFileTypes = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    "application/pdf": [".pdf"],
    "text/*": [".txt", ".md"],
  },
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false,
  files = [],
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (onFileSelect) {
        onFileSelect(acceptedFiles);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles,
    maxSize,
    disabled,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="mb-2 text-lg font-medium">Drag & drop files here, or click to select</p>
            <p className="text-muted-foreground text-sm">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Selected Files:</h4>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {getFileIcon(file)}
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onFileRemove?.(file)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
