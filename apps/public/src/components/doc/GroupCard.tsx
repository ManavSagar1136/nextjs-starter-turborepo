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
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mk-brand)] focus-visible:ring-offset-2 rounded-[var(--mk-radius-lg)] transition-all"
      aria-label={`Navigate to ${groupName} documentation group with ${docCount} ${docCount === 1 ? "document" : "documents"}`}
      tabIndex={0}
    >
      <div
        className="h-full mk-card mk-card-static hover:-translate-y-1.5 cursor-pointer group relative overflow-hidden"
        style={{ background: "var(--mk-bg-secondary)" }}
      >
        {/* Decorative background element */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors duration-300"
          style={{ background: "var(--mk-brand-muted)" }}
          aria-hidden="true"
        />

        <div className="p-6 pb-4 relative z-10">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex-shrink-0 p-2.5 rounded-[var(--mk-radius-md)] transition-all duration-300 shadow-sm"
                style={{ background: "var(--mk-brand-muted)" }}
              >
                <Folder className="h-5 w-5 group-hover:hidden" style={{ color: "var(--mk-brand)" }} />
                <FolderOpen className="h-5 w-5 hidden group-hover:block" style={{ color: "var(--mk-brand)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-lg transition-colors duration-200 truncate mb-1 group-hover:text-[var(--mk-brand)]"
                  style={{ color: "var(--mk-text-primary)" }}
                >
                  {groupName}
                </h3>
                {isNested && (
                  <div className="flex items-center gap-1.5 text-xs truncate" style={{ color: "var(--mk-text-muted)" }}>
                    <span className="opacity-60">
                      {pathSegments.slice(0, -1).join(" / ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="text-xs flex-shrink-0 transition-colors"
              style={{ background: "var(--mk-brand-muted)", color: "var(--mk-brand)" }}
            >
              Group
            </Badge>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--mk-radius-sm)] transition-colors"
                style={{ background: "var(--mk-bg-elevated)" }}
              >
                <Files className="h-4 w-4 transition-colors" style={{ color: "var(--mk-brand)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--mk-text-primary)" }}>
                  {docCount}
                </span>
                <span className="text-xs" style={{ color: "var(--mk-text-muted)" }}>
                  {docCount === 1 ? "doc" : "docs"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 transition-colors group-hover:text-[var(--mk-brand)]" style={{ color: "var(--mk-text-muted)" }}>
              <span className="text-xs font-medium hidden sm:inline-block">
                Explore
              </span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;
