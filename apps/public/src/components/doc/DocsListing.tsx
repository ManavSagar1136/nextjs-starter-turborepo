import { formatGroupName } from "@buildbase/utils/path-utils";
import { compareDesc } from "date-fns";

import { IDocPost } from "@/services/docs";

import { DocLayout } from "../content/DocLayout";
import DocCard from "./DocCard";
import DocsEmpty from "./DocsEmpty";
import GroupCard from "./GroupCard";
import { BreadcrumbItemConfig } from "@buildbase/ui/components/ui/app-breadcrumb";

import { DocFolderService } from "@/lib/docs/doc-folder.service";
import { DocPostService } from "@/lib/docs/doc-post.service";

/**
 * Counts the total number of docs found within a given folder (recursively).
 * Counts all docs directly in the folder and in all subfolders.
 *
 * @param docs - Array of all document objects.
 * @param folderPath - Path representing the folder (folders separated by "/").
 * @returns The total count of docs in the folder and all subfolders.
 */
const countDocsInFolder = (docs: IDocPost[], folderPath: string): number => {
  return docs.filter((doc) => {
    if (!doc.folder?.path) return false;
    const docPath = doc.folder.path;
    // Count docs that are directly in this folder
    // OR docs in any subfolder (path starts with folderPath/)
    return docPath === folderPath || docPath.startsWith(`${folderPath}/`);
  }).length;
};

/**
 * Combines, annotates, and sorts first-level items (docs and folders).
 * Folders are shown before docs. Folders are sorted alphabetically by name.
 * Docs are sorted by order (if present), then date (descending), then title.
 *
 * @param docs - Array of document objects at this level.
 * @param folders - Array of folder objects at this level.
 * @param allDocs - Array of all document objects for counting docs in folders.
 * @returns Array of FirstLevelItem (united folders and docs, ordered).
 */
const getItems = (
  docs: IDocPost[],
  folders: any[],
  allDocs: IDocPost[],
): FirstLevelItem[] => {
  // Deduplicate folders by id to prevent duplicates
  const uniqueFolders = Array.from(
    new Map(folders.map((folder) => [folder.id, folder])).values()
  );
  
  // Deduplicate docs by id to prevent duplicates
  const uniqueDocs = Array.from(
    new Map(docs.map((doc) => [doc.id, doc])).values()
  );
  
  // Combine and sort items
  const tempItems: FirstLevelItem[] = [
    ...uniqueDocs.map((doc) => ({ type: "doc" as const, doc })),
    ...uniqueFolders.map((folder) => ({
      type: "group" as const,
      groupPath: folder.path || folder.slug,
      docCount: countDocsInFolder(allDocs, folder.path || folder.slug),
    })),
  ];

  tempItems.sort((a, b) => {
    // Groups come first
    if (a.type === "group" && b.type === "doc") return -1;
    if (a.type === "doc" && b.type === "group") return 1;

    // Both are groups - sort by name
    if (a.type === "group" && b.type === "group") {
      return (a.groupPath || "").localeCompare(b.groupPath || "");
    }

    // Both are docs - sort by order, then by date, then by title
    if (a.type === "doc" && b.type === "doc") {
      const docA = a.doc!;
      const docB = b.doc!;

      if (docA.order !== undefined && docB.order !== undefined) {
        return (docA.order || 0) - (docB.order || 0);
      }
      if (docA.order !== undefined) return -1;
      if (docB.order !== undefined) return 1;

      if (docA.publishedAt && docB.publishedAt) {
        return compareDesc(
          new Date(docA.publishedAt),
          new Date(docB.publishedAt),
        );
      }
      if (docA.publishedAt) return -1;
      if (docB.publishedAt) return 1;

      return (docA.title || "").localeCompare(docB.title || "");
    }

    return 0;
  });

  return tempItems;
};

/**
 * Represents a unit displayed in the DocsListing UI.
 * Each item can be a doc or a folder/group.
 */
interface FirstLevelItem {
  type: "doc" | "group";
  doc?: IDocPost;
  groupPath?: string;
  docCount?: number;
}

/**
 * Props for the DocsListing component.
 */
interface DocsListingProps {
  groupPath?: string;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemConfig[];
}

/**
 * Renders a documentation listing view.
 * This component displays a listing grid of documentation pages and folders for a given folder/subfolder.
 * It includes folder navigation, description, and handles empty directory states.
 *
 * @param groupPath - (Optional) The folder path to display docs/folders from.
 * @param title - (Optional) Custom page title.
 * @param description - (Optional) Custom page description.
 * @param breadcrumbs - (Optional) Breadcrumb navigation items.
 */
const DocsListing = async ({
  groupPath,
  title,
  description,
  breadcrumbs,
}: DocsListingProps) => {
  // Fetch all published documents
  const allDocsResult = await DocPostService.listDocPosts({
    published: true,
    includeDeleted: false,
    limit: 1000,
  });
  const allDocs = allDocsResult.posts || [];

  // Get folder if groupPath is provided
  let targetFolder = null;
  if (groupPath) {
    targetFolder = await DocFolderService.getFolderByPath(groupPath, false);
  }

  // Get folders at this level
  const allFolders = await DocFolderService.listFolders(false);
  const levelFolders = groupPath
    ? allFolders.filter((folder) => {
        // Only show direct children of the current folder
        // Exclude the folder itself
        if (!targetFolder) return false;
        return folder.parentFolderId === targetFolder.id;
      })
    : allFolders.filter((folder) => !folder.parentFolderId);

  // Get docs at this level
  const levelDocs = groupPath
    ? allDocs.filter((doc) => {
        if (!doc.folder?.path) return false;
        const docPath = doc.folder.path;
        // Only show docs that are directly in this folder (not in subfolders)
        return docPath === groupPath;
      })
    : allDocs.filter((doc) => !doc.folderId);

  /**
   * Get the items at the current level.
   */
  const items = getItems(
    levelDocs as unknown as IDocPost[],
    levelFolders,
    allDocs as unknown as IDocPost[],
  );

  /**
   * Get the display title and description.
   */
  const { displayTitle, displayDescription } = {
    displayTitle:
      title || (groupPath ? formatGroupName(groupPath) : "Documentation"),
    displayDescription:
      description ||
      (groupPath
        ? `Explore documentation and guides for ${formatGroupName(groupPath).toLowerCase()}`
        : "Complete guides and reference documentation for our platform"),
  };

  return (
    <DocLayout
      breadcrumbs={breadcrumbs}
      title={displayTitle}
      description={displayDescription}
    >
      <div className="space-y-6">
        {items.length === 0 ? (
          <DocsEmpty
            title={
              groupPath
                ? `There aren't any docs for ${formatGroupName(groupPath)} yet`
                : "No documentation available"
            }
            description={
              groupPath
                ? `Looks like we don't have any documentation in the "${formatGroupName(groupPath)}" group yet. New guides may be added here soon — check back for updates!`
                : "It seems we haven't published any documentation yet. We're working hard to add helpful content — please check back again soon!"
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div
                key={
                  item.type === "doc"
                    ? item.doc?.id
                    : `group-${item.groupPath}-${index}`
                }
              >
                {item.type === "doc" ? (
                  <DocCard data={item.doc} />
                ) : (
                  <GroupCard
                    groupPath={item.groupPath!}
                    docCount={item.docCount || 0}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DocLayout>
  );
};

export default DocsListing;
