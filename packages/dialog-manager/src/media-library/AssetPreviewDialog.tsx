"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCw,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const FileTypeIcon = getFileTypeIcon(asset.contentType);
  const canPreview = isPreviewable(asset.contentType);
  const isImage = asset.contentType?.startsWith("image/");

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(asset.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    window.open(asset.url, "_blank");
  };

  // Image zoom and pan handlers
  const handleZoomIn = useCallback(() => {
    setImageZoom(prev => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (imageZoom > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
      }
    },
    [imageZoom, imagePosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && imageZoom > 1) {
        setImagePosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, imageZoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isImage && e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setImageZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
      }
    },
    [isImage]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || !isImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === "f" || e.key === "F") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setIsFullscreen(prev => !prev);
        }
      } else if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === "=" || e.key === "+") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleZoomIn();
        }
      } else if (e.key === "-") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleZoomOut();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isImage, isFullscreen, handleResetZoom, handleZoomIn, handleZoomOut]);

  // Reset zoom when dialog closes or asset changes
  useEffect(() => {
    if (!open) {
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
      setIsFullscreen(false);
    }
  }, [open, asset.id]);

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
        <div
          ref={containerRef}
          className="bg-muted/20 relative overflow-hidden rounded-lg border"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: imageZoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <div className="relative flex h-[500px] items-center justify-center overflow-hidden">
            <img
              ref={imageRef}
              src={asset.url}
              alt={asset.filename || asset.name}
              className="max-h-full max-w-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                transformOrigin: "center center",
              }}
              draggable={false}
            />
          </div>
          {/* Zoom controls */}
          <div className="bg-background/80 absolute bottom-2 right-2 flex gap-1 rounded-lg p-1 shadow-lg backdrop-blur-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleZoomOut}
              disabled={imageZoom <= 0.5}
              title="Zoom out (Ctrl/Cmd + -)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="flex items-center px-2 text-xs font-medium">{Math.round(imageZoom * 100)}%</div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleZoomIn}
              disabled={imageZoom >= 5}
              title="Zoom in (Ctrl/Cmd + +)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleResetZoom}
              disabled={imageZoom === 1}
              title="Reset zoom (Ctrl/Cmd + 0)"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsFullscreen(prev => !prev)}
              title="Fullscreen (Ctrl/Cmd + F)"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
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
          <div className="relative">
            <iframe
              src={`${asset.url}#toolbar=1&navpanes=1&scrollbar=1`}
              className="h-[600px] w-full"
              title={asset.filename || asset.name}
              allow="fullscreen"
            />
            <div className="bg-background/80 absolute bottom-2 right-2 flex gap-1 rounded-lg p-1 shadow-lg backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsFullscreen(prev => !prev)}
                title="Fullscreen (Ctrl/Cmd + F)"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Fullscreen overlay for images */}
      {isFullscreen && isImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="relative h-full w-full"
            onClick={e => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: imageZoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          >
            <img
              src={asset.url}
              alt={asset.filename || asset.name}
              className="absolute left-1/2 top-1/2 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2 object-contain transition-transform duration-200"
              style={{
                transform: `translate(-50%, -50%) scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
              }}
              draggable={false}
            />
            <div className="bg-background/80 absolute bottom-4 right-4 flex gap-1 rounded-lg p-1 shadow-lg backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={handleZoomOut}
                disabled={imageZoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-2 text-xs font-medium text-white">
                {Math.round(imageZoom * 100)}%
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={handleZoomIn}
                disabled={imageZoom >= 5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={handleResetZoom}
                disabled={imageZoom === 1}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={isFullscreen && !isImage ? "max-h-[95vh] max-w-[95vw]" : "max-w-3xl"}>
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
    </>
  );
}
