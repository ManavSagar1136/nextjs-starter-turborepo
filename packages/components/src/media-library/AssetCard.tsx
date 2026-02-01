"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Download,
  Eye,
  File,
  Folder,
  Globe,
  Lock,
  MoreVertical,
  Tag as TagIcon,
  Trash2,
  Check,
} from "lucide-react";

import { Badge } from "@buildbase/ui/badge";
import { Button } from "@buildbase/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@buildbase/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@buildbase/ui/dropdown-menu";
import { cn } from "@buildbase/ui/lib/utils";

import { useMediaLibrary } from "./context";
import { ASSET_ACTIONS, type IAsset, type IAssetAction } from "./types";
import { formatFileSize, formatRelativeTime, getFileExtension, getFileTypeConfig, isImageContentType } from "./utils";

// ============================================================================
// Types
// ============================================================================

interface AssetCardProps {
  asset: IAsset;
  className?: string;
}

interface AssetListItemProps {
  asset: IAsset;
  className?: string;
}

// ============================================================================
// Shared Menu Items Builder
// ============================================================================

interface MenuItemConfig {
  type: "item" | "separator";
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  action?: IAssetAction;
  className?: string;
  disabled?: boolean;
  requiresFolders?: boolean;
  requiresTags?: boolean;
  requiresPrivacyToggle?: boolean;
}

function useAssetMenuItems(asset: IAsset, ongoingAction: IAssetAction | null) {
  const { config, onAssetAction } = useMediaLibrary();

  return useMemo(() => {
    const items: MenuItemConfig[] = [
      {
        type: "item",
        icon: Eye,
        label: "Preview",
        action: ASSET_ACTIONS.PREVIEW,
      },
      {
        type: "item",
        icon: Download,
        label: "Download",
        action: ASSET_ACTIONS.DOWNLOAD,
      },
      {
        type: "item",
        icon: Copy,
        label: "Copy URL",
        action: ASSET_ACTIONS.COPY_URL,
      },
      { type: "separator" },
      {
        type: "item",
        icon: TagIcon,
        label: "Manage Tags",
        action: ASSET_ACTIONS.ASSIGN_TAGS,
        requiresTags: true,
      },
      {
        type: "item",
        icon: Folder,
        label: "Move to Folder",
        action: ASSET_ACTIONS.MOVE,
        requiresFolders: true,
      },
      { type: "separator" },
      {
        type: "item",
        icon: asset.isPublic ? Lock : Globe,
        label: asset.isPublic ? "Make Private" : "Make Public",
        action: ASSET_ACTIONS.TOGGLE_PRIVACY,
        disabled: ongoingAction === ASSET_ACTIONS.TOGGLE_PRIVACY,
        requiresPrivacyToggle: true,
      },
      { type: "separator" },
      {
        type: "item",
        icon: Trash2,
        label: "Delete",
        action: ASSET_ACTIONS.DELETE,
        className: "text-destructive focus:text-destructive",
      },
    ];

    // Filter based on config
    return items
      .filter(item => {
        if (item.type === "separator") return true;
        if (item.requiresFolders && !config.enableFolders) return false;
        if (item.requiresTags && !config.enableTags) return false;
        if (item.requiresPrivacyToggle && !config.enablePrivacyToggle) return false;
        return true;
      })
      .filter((item, index, array) => {
        // Remove consecutive separators and leading/trailing separators
        if (item.type !== "separator") return true;
        const prevItem = array[index - 1];
        const nextItem = array[index + 1];
        return (
          prevItem?.type !== "separator" && nextItem?.type !== "separator" && index > 0 && index < array.length - 1
        );
      });
  }, [asset.isPublic, ongoingAction, config]);
}

// ============================================================================
// Asset Card (Grid View)
// ============================================================================

export function AssetCard({ asset, className }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { config, selectedTagIds, selectedAssetIds, toggleAssetSelection, onAssetAction, getOngoingAssetAction } =
    useMediaLibrary();

  const isSelected = selectedAssetIds.includes(asset.id);

  const fileConfig = useMemo(() => getFileTypeConfig(asset.contentType || ""), [asset.contentType]);

  const { action: ongoingAction } = getOngoingAssetAction(asset);
  const menuItems = useAssetMenuItems(asset, ongoingAction);
  const hasMenuItems = menuItems.filter(item => item.type !== "separator").length > 0;

  const isImage = asset.contentType && isImageContentType(asset.contentType);
  const displayName = asset.filename || asset.name;
  const extension = getFileExtension(asset.filename, asset.contentType);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "asset", id: asset.id }));
    e.dataTransfer.setData("text/plain", asset.id);
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md",
        "hover:border-primary/20 bg-card",
        isSelected && "ring-primary border-primary ring-2",
        "cursor-move",
        className
      )}
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      <div className="absolute left-3 top-3 z-10">
        <div
          className={cn(
            "bg-background/90 border-border rounded-md border p-1 shadow-lg backdrop-blur-sm transition-opacity",
            isHovered || isSelected ? "opacity-100" : "opacity-0"
          )}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleAssetSelection(asset.id)}
            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
            className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300 focus:ring-2"
            aria-label={`Select ${displayName}`}
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div className="from-muted/50 to-muted relative aspect-square overflow-hidden bg-gradient-to-br">
        {isImage && asset.url ? (
          <>
            {!imageLoaded && (
              <div className="from-muted to-muted/50 absolute inset-0 flex items-center justify-center bg-gradient-to-br">
                <div className="animate-pulse">
                  <File className="text-muted-foreground h-10 w-10" />
                </div>
              </div>
            )}
            <img
              src={asset.url}
              alt={displayName}
              className={cn(
                "h-full w-full object-cover transition-all duration-500",
                imageLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
              )}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <File className="text-muted-foreground h-10 w-10" aria-hidden="true" />
          </div>
        )}

        {/* Hover overlay with actions */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0",
            "transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="absolute right-3 top-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/90 hover:bg-background h-8 w-8 p-0 shadow-lg backdrop-blur-sm"
              onClick={() => onAssetAction({ action: ASSET_ACTIONS.PREVIEW, asset })}
              aria-label={`Preview ${displayName}`}
              title="Preview asset"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
            {hasMenuItems && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-background/90 hover:bg-background h-8 w-8 p-0 shadow-lg backdrop-blur-sm"
                    aria-label={`More options for ${displayName}`}
                    title="More options"
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {menuItems.map((item, i) =>
                    item.type === "separator" ? (
                      <DropdownMenuSeparator key={i} />
                    ) : (
                      <DropdownMenuItem
                        key={i}
                        onClick={() => item.action && onAssetAction({ action: item.action, asset })}
                        disabled={item.disabled}
                        className={item.className}
                      >
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        {item.label}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          {extension && (
            <Badge
              variant="secondary"
              className="bg-background/95 text-foreground border-border border text-xs backdrop-blur-sm"
            >
              {extension}
            </Badge>
          )}
          {config.enablePrivacyToggle && asset.isPublic !== undefined && (
            <Badge
              variant={asset.isPublic ? "default" : "secondary"}
              className={cn(
                "bg-background/95 border-border gap-1 rounded-full border text-xs backdrop-blur-sm",
                asset.isPublic
                  ? "bg-primary/90 text-primary-foreground border-primary/50"
                  : "bg-background/95 text-foreground"
              )}
            >
              {asset.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <CardHeader className="p-4 pb-2">
        <p className="text-foreground truncate text-sm font-medium" title={displayName}>
          {displayName}
        </p>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
          {config.enableFolders && asset.folder && (
            <span className="flex items-center gap-1 truncate">
              <Folder className="h-3 w-3 shrink-0" />
              <span className="truncate">{asset.folder.name}</span>
            </span>
          )}
          {asset.size && (
            <>
              {asset.folder && <span>•</span>}
              <span>{formatFileSize(asset.size)}</span>
            </>
          )}
        </div>
      </CardHeader>

      {/* Tags */}
      {config.enableTags && (
        <CardFooter className="flex min-h-[2.5rem] flex-wrap gap-1.5 p-4 pt-2">
          {asset.tags && asset.tags.length > 0 ? (
            <>
              {asset.tags.slice(0, 2).map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedTagIds.includes(tag.id) ? "default" : "secondary"}
                  className="cursor-pointer px-2 py-0.5 text-xs transition-opacity hover:opacity-80"
                  onClick={() => onAssetAction({ action: ASSET_ACTIONS.TAG_TOGGLE, asset, tag })}
                  style={
                    tag.color
                      ? {
                          backgroundColor: tag.color + "20",
                          color: tag.color,
                          borderColor: tag.color + "40",
                        }
                      : undefined
                  }
                >
                  {tag.name}
                </Badge>
              ))}
              {asset.tags.length > 2 && (
                <Badge variant="outline" className="px-2 py-0.5 text-xs">
                  +{asset.tags.length - 2}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-xs italic">No tags</span>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// ============================================================================
// Asset List Item (List View)
// ============================================================================

export function AssetListItem({ asset, className }: AssetListItemProps) {
  const { config, selectedTagIds, selectedAssetIds, toggleAssetSelection, onAssetAction, getOngoingAssetAction } =
    useMediaLibrary();

  const isSelected = selectedAssetIds.includes(asset.id);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "asset", id: asset.id }));
    e.dataTransfer.setData("text/plain", asset.id);
  };

  const fileConfig = useMemo(() => getFileTypeConfig(asset.contentType || ""), [asset.contentType]);

  const { action: ongoingAction } = getOngoingAssetAction(asset);
  const menuItems = useAssetMenuItems(asset, ongoingAction);

  const isImage = asset.contentType && isImageContentType(asset.contentType);
  const displayName = asset.filename || asset.name;

  return (
    <Card
      className={cn(
        "hover:bg-accent/50 border-border shadow-sm transition-colors",
        isSelected && "ring-primary border-primary ring-2",
        "cursor-move",
        className
      )}
      draggable
      onDragStart={handleDragStart}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleAssetSelection(asset.id)}
          onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
          className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300 focus:ring-2"
        />

        {/* Thumbnail */}
        <div
          className={cn(
            "from-muted to-muted/50 h-20 w-20 rounded-lg bg-gradient-to-br",
            "border-border flex shrink-0 items-center justify-center overflow-hidden border"
          )}
        >
          {isImage && asset.url ? (
            <img
              src={asset.url}
              alt={`${displayName} - ${asset.contentType || "file"}`}
              className="h-full w-full object-cover"
              loading="lazy"
              role="img"
            />
          ) : (
            <File className="text-muted-foreground h-8 w-8" aria-hidden="true" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">{displayName}</p>
          <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-4 text-sm">
            {config.enableFolders && asset.folder && (
              <span className="flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5" />
                {asset.folder.name}
              </span>
            )}
            <span>{formatRelativeTime(asset.createdAt)}</span>
            {asset.size && <span className="font-medium">{formatFileSize(asset.size)}</span>}
          </div>
          {config.enableTags && asset.tags && asset.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {asset.tags.map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedTagIds.includes(tag.id) ? "default" : "secondary"}
                  className="cursor-pointer text-xs transition-opacity hover:opacity-80"
                  onClick={() => onAssetAction({ action: ASSET_ACTIONS.TAG_TOGGLE, asset, tag })}
                  style={
                    tag.color
                      ? {
                          backgroundColor: tag.color + "20",
                          color: tag.color,
                          borderColor: tag.color + "40",
                        }
                      : undefined
                  }
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {config.enableTags && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAssetAction({ action: ASSET_ACTIONS.ASSIGN_TAGS, asset })}
              className="h-9 w-9"
            >
              <TagIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAssetAction({ action: ASSET_ACTIONS.DELETE, asset })}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-9 w-9"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
