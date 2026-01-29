"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@buildbase/ui/dialog";
import { Button } from "@buildbase/ui/button";
import { Badge } from "@buildbase/ui/badge";
import { ScrollArea } from "@buildbase/ui/scroll-area";

// Simple separator component
const Separator = ({ className }: { className?: string }) => (
  <div className={`bg-border h-px w-full ${className || ""}`} />
);
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  Folder,
  Calendar,
  HardDrive,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  FileText,
  File,
  Tag,
  Pencil,
  Trash2,
  Move,
} from "lucide-react";
import type { DialogOrSheetBaseProps } from "../base-props";

// ============================================================================
// Types
// ============================================================================

export interface AssetPreviewDialogProps extends DialogOrSheetBaseProps {
  /** Asset data */
  asset: {
    id: string;
    name: string;
    filename?: string;
    url: string;
    contentType?: string;
    size?: number;
    width?: number;
    height?: number;
    isPublic?: boolean;
    createdAt: string;
    updatedAt: string;
    folder?: {
      id: string;
      name: string;
      path?: Array<{ id: string; name: string }>;
    } | null;
    tags?: Array<{
      id: string;
      name: string;
      color?: string | null;
    }>;
    metadata?: Record<string, unknown>;
  };
  /** Show action buttons */
  showActions?: boolean;
  /** Callback when download is clicked */
  onDownload?: () => void;
  /** Callback when edit is clicked */
  onEdit?: () => void;
  /** Callback when move is clicked */
  onMove?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Callback when toggle privacy is clicked */
  onTogglePrivacy?: () => void;
  /** Callback when assign tags is clicked */
  onAssignTags?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileTypeIcon(contentType?: string) {
  if (!contentType) return File;
  if (contentType.startsWith("image/")) return ImageIcon;
  if (contentType.startsWith("video/")) return FileVideo;
  if (contentType.startsWith("audio/")) return FileAudio;
  if (contentType.includes("pdf") || contentType.includes("document") || contentType.startsWith("text/")) {
    return FileText;
  }
  return File;
}

function isPreviewable(contentType?: string): boolean {
  if (!contentType) return false;
  return (
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/") ||
    contentType === "application/pdf"
  );
}

// ============================================================================
// Component
// ============================================================================

export function AssetPreviewDialog({
  open,
  onOpenChange,
  asset,
  showActions = true,
  onDownload,
  onEdit,
  onMove,
  onDelete,
  onTogglePrivacy,
  onAssignTags,
}: AssetPreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  const FileTypeIcon = getFileTypeIcon(asset.contentType);
  const canPreview = isPreviewable(asset.contentType);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(asset.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    window.open(asset.url, "_blank");
  };

  const renderPreview = () => {
    if (!canPreview) {
      return (
        <div className="bg-muted/50 flex h-64 items-center justify-center rounded-lg border">
          <div className="text-center">
            <FileTypeIcon className="text-muted-foreground mx-auto h-16 w-16" />
            <p className="text-muted-foreground mt-2 text-sm">Preview not available</p>
          </div>
        </div>
      );
    }

    if (asset.contentType?.startsWith("image/")) {
      return (
        <div className="bg-muted/20 relative overflow-hidden rounded-lg border">
          <img src={asset.url} alt={asset.filename || asset.name} className="max-h-[400px] w-full object-contain" />
        </div>
      );
    }

    if (asset.contentType?.startsWith("video/")) {
      return (
        <div className="overflow-hidden rounded-lg border">
          <video src={asset.url} controls className="max-h-[400px] w-full">
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (asset.contentType?.startsWith("audio/")) {
      return (
        <div className="bg-muted/20 flex h-32 items-center justify-center rounded-lg border p-4">
          <audio src={asset.url} controls className="w-full">
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (asset.contentType === "application/pdf") {
      return (
        <div className="overflow-hidden rounded-lg border">
          <iframe src={asset.url} className="h-[400px] w-full" title={asset.filename || asset.name} />
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileTypeIcon className="text-muted-foreground h-5 w-5" />
            <span className="truncate">{asset.filename || asset.name}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100vh-200px)]">
          <div className="space-y-6 pr-4">
            {/* Preview */}
            {renderPreview()}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy URL"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>

            <Separator />

            {/* Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* File Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">File Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span>Size: {formatFileSize(asset.size)}</span>
                  </div>
                  {asset.contentType && (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <FileTypeIcon className="h-4 w-4" />
                      <span>Type: {asset.contentType}</span>
                    </div>
                  )}
                  {asset.width && asset.height && (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>
                        Dimensions: {asset.width} × {asset.height}
                      </span>
                    </div>
                  )}
                  <div className="text-muted-foreground flex items-center gap-2">
                    {asset.isPublic ? (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates & Location */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {formatDate(asset.createdAt)}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Modified: {formatDate(asset.updatedAt)}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>
                      Folder:{" "}
                      {asset.folder ? asset.folder.path?.map(f => f.name).join(" / ") || asset.folder.name : "Root"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {asset.tags && asset.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        style={tag.color ? { backgroundColor: `${tag.color}20`, borderColor: tag.color } : undefined}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            {showActions && (onEdit || onMove || onDelete || onTogglePrivacy || onAssignTags) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {onAssignTags && (
                      <Button variant="outline" size="sm" onClick={onAssignTags}>
                        <Tag className="mr-2 h-4 w-4" />
                        Manage Tags
                      </Button>
                    )}
                    {onMove && (
                      <Button variant="outline" size="sm" onClick={onMove}>
                        <Move className="mr-2 h-4 w-4" />
                        Move
                      </Button>
                    )}
                    {onTogglePrivacy && (
                      <Button variant="outline" size="sm" onClick={onTogglePrivacy}>
                        {asset.isPublic ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Make Public
                          </>
                        )}
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={onDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
