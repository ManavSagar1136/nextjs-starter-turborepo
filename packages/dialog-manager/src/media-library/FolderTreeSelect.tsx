"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderTree, Loader2 } from "lucide-react";

import { Button } from "@buildbase/ui/button";
import { ScrollArea } from "@buildbase/ui/scroll-area";

import type { FolderTreeItem } from "./types";

interface FolderTreeSelectProps {
  /** Selected folder ID (null for root) */
  value: string | null;
  /** Callback when selection changes */
  onChange: (folderId: string | null) => void;
  /** Folder tree data */
  folders: FolderTreeItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Folders to exclude from selection (e.g., the folder being moved) */
  excludeFolderIds?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show the root option */
  showRoot?: boolean;
  /** Root option label */
  rootLabel?: string;
}

interface FolderNodeProps {
  folder: FolderTreeItem;
  depth: number;
  selectedId: string | null;
  excludeIds: string[];
  onSelect: (id: string) => void;
}

function FolderNode({ folder, depth, selectedId, excludeIds, onSelect }: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isExcluded = excludeIds.includes(folder.id);
  const isSelected = selectedId === folder.id;

  if (isExcluded) return null;

  return (
    <div>
      <button
        type="button"
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        } ${isExcluded ? "cursor-not-allowed opacity-50" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => !isExcluded && onSelect(folder.id)}
        disabled={isExcluded}
      >
        {hasChildren ? (
          <span
            className="hover:bg-accent-foreground/10 shrink-0 rounded p-0.5"
            onClick={e => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        ) : (
          <span className="w-4.5" />
        )}
        <Folder className={`h-4 w-4 shrink-0 ${isSelected ? "" : "text-muted-foreground"}`} />
        <span className="truncate">{folder.name}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedId={selectedId}
              excludeIds={excludeIds}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTreeSelect({
  value,
  onChange,
  folders,
  isLoading = false,
  excludeFolderIds = [],
  placeholder = "Select a folder",
  showRoot = true,
  rootLabel = "Root (No Folder)",
}: FolderTreeSelectProps) {
  const isRootSelected = value === null;

  if (isLoading) {
    return (
      <div className="bg-muted/30 flex items-center justify-center rounded-lg border py-8">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        <span className="text-muted-foreground ml-2 text-sm">Loading folders...</span>
      </div>
    );
  }

  if (folders.length === 0 && !showRoot) {
    return (
      <div className="bg-muted/30 flex flex-col items-center justify-center rounded-lg border py-8 text-center">
        <Folder className="text-muted-foreground mb-2 h-8 w-8" />
        <p className="text-muted-foreground text-sm">No folders available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <ScrollArea className="h-[250px]">
        <div className="p-2">
          {/* Root option */}
          {showRoot && (
            <button
              type="button"
              className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                isRootSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
              onClick={() => onChange(null)}
            >
              <FolderTree className={`h-4 w-4 shrink-0 ${isRootSelected ? "" : "text-muted-foreground"}`} />
              <span>{rootLabel}</span>
            </button>
          )}

          {/* Folder tree */}
          {folders.map(folder => (
            <FolderNode
              key={folder.id}
              folder={folder}
              depth={0}
              selectedId={value}
              excludeIds={excludeFolderIds}
              onSelect={onChange}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
