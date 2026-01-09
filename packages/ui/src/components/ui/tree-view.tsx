import * as React from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: React.ReactNode;
  isLeaf?: boolean;
}

export interface TreeViewProps {
  data: TreeNode[];
  onNodeSelect?: (node: TreeNode) => void;
  onNodeToggle?: (nodeId: string, expanded: boolean) => void;
  className?: string;
  defaultExpanded?: string[];
  selectedNodeId?: string;
}

export function TreeView({
  data,
  onNodeSelect,
  onNodeToggle,
  className,
  defaultExpanded = [],
  selectedNodeId,
}: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set(defaultExpanded));

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    const isExpanded = expandedNodes.has(nodeId);

    if (isExpanded) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }

    setExpandedNodes(newExpanded);
    onNodeToggle?.(nodeId, !isExpanded);
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-sm",
            isSelected && "bg-accent text-accent-foreground",
            level > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            onNodeSelect?.(node);
          }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={e => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}

          {node.icon ? (
            node.icon
          ) : hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )
          ) : (
            <File className="h-4 w-4" />
          )}

          <span className="ml-1">{node.label}</span>
        </div>

        {hasChildren && isExpanded && <div>{node.children!.map(child => renderNode(child, level + 1))}</div>}
      </div>
    );
  };

  return <div className={cn("w-full", className)}>{data.map(node => renderNode(node))}</div>;
}
