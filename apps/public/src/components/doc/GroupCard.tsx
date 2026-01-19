import Link from "next/link";
import { Routes } from "@/data/routes";
import { formatGroupName } from "@buildbase/utils/path-utils";
import { ChevronRight, Files, Folder, FolderOpen } from "lucide-react";

import { Badge } from "@buildbase/ui/components/ui/badge";
import { Card, CardContent, CardHeader } from "@buildbase/ui/components/ui/card";

/**
 * Props for the GroupCard component.
 */
interface GroupCardProps {
  /** The path segment for the group, e.g. "foo/bar" */
  groupPath: string;
  /** Total number of direct documents within this group */
  docCount: number;
}

/**
 * Converts a path into an array of breadcrumb segments.
 *
 * @param path - The group path string, e.g. "foo/bar"
 * @returns Array of non-empty segments
 */
const getGroupPathBreadcrumb = (path: string): string[] => {
  return path.split("/").filter(Boolean);
};

/**
 * A card UI component representing a documentation group/folder in a docs listing.
 *
 * Displays icon, formatted group name, breadcrumb info (if nested), and a doc count badge.
 * Navigates to the docs group on click or keyboard activation (Enter/Space).
 *
 * @param groupPath - Path to the documentation group (e.g., "api/auth")
 * @param docCount - Number of direct documents in the group
 */
const GroupCard = ({ groupPath, docCount }: GroupCardProps) => {
  const groupName = formatGroupName(groupPath);
  const href = `${Routes.docs}/${groupPath}`;
  const pathSegments = getGroupPathBreadcrumb(groupPath);
  const isNested = pathSegments.length > 1;

  return (
    <Link
      href={href}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg transition-all"
      aria-label={`Navigate to ${groupName} documentation group with ${docCount} ${docCount === 1 ? "document" : "documents"}`}
      tabIndex={0}
    >
      <Card className="h-full hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group border-2 border-border/50 hover:border-primary/60 bg-gradient-to-br from-card via-card to-primary/5 hover:to-primary/10 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-300" />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <Folder className="h-5 w-5 text-primary group-hover:hidden" />
                <FolderOpen className="h-5 w-5 text-primary hidden group-hover:block" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200 truncate mb-1">
                  {groupName}
                </h3>
                {isNested && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                    <span className="opacity-60">
                      {pathSegments.slice(0, -1).join(" / ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="text-xs flex-shrink-0 bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors"
            >
              Group
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                <Files className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-foreground">
                  {docCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  {docCount === 1 ? "doc" : "docs"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
              <span className="text-xs font-medium hidden sm:inline-block">
                Explore
              </span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GroupCard;
