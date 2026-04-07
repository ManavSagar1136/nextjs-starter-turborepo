/** Your class description */

import { Routes } from "@/data/routes";
import { formatGroupName } from "@buildbase/utils/path-utils";
import { Home } from "lucide-react";

import DocsListing from "./DocsListing";

/**
 * Props for GroupRender component.
 * @property groupPath - The path to the documentation group, e.g., "api/auth".
 * @property page - Current pagination page (default 1).
 */
interface GroupRenderProps {
  groupPath: string;
  page?: number;
}

/**
 * Builds the breadcrumbs array from a given group path.
 * Breadcrumbs provide page hierarchy for navigation aids in the UI.
 * The structure always begins with Home > Documentation,
 * and for each groupPath segment, a breadcrumb is built.
 *
 * @param path - The full group path, e.g., "getting-started/core"
 * @returns Array of breadcrumb items (icon/title and href)
 */
const buildBreadcrumbs = (
  path: string,
): Array<{ title?: string; href?: string; icon?: React.ReactNode }> => {
  // Root home and Documentation as static breadcrumbs
  const breadcrumbs: Array<{
    title?: string;
    href?: string;
    icon?: React.ReactNode;
  }> = [
    { icon: <Home className="h-4 w-4" />, href: Routes.root },
    { title: "Documentation", href: Routes.docs },
  ];

  // Split the group path into segments like ['getting-started', ...]
  const segments = path.split("/").filter(Boolean);

  let currentPath = "";

  segments.forEach((segment, index) => {
    // Compose the current cumulative path as we go.
    currentPath = index === 0 ? segment : `${currentPath}/${segment}`;
    const isLast = index === segments.length - 1;
    // Don't link the last breadcrumb.
    breadcrumbs.push({
      title: formatGroupName(segment),
      href: isLast ? undefined : `${Routes.docs}/${currentPath}`,
    });
  });

  return breadcrumbs;
};

/**
 * GroupRender component.
 * Renders a documentation group listing page with breadcrumbs navigation based on the groupPath.
 *
 * @param props - GroupRenderProps containing the target `groupPath`
 * @returns The rendered DocsListing component with breadcrumbs
 */
const GroupRender = ({ groupPath, page = 1 }: GroupRenderProps) => {
  // Compute breadcrumbs based on the provided groupPath
  const breadcrumbs = buildBreadcrumbs(groupPath);

  // Render a DocsListing page with breadcrumbs for the given group
  return <DocsListing groupPath={groupPath} breadcrumbs={breadcrumbs} page={page} />;
};

export default GroupRender;
