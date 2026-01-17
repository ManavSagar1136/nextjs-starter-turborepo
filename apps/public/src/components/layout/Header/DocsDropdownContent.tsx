import { IDocPost } from "@/services/docs";

import { API } from "@/services";

import { DocsDropdownContentClient } from "./DocsDropdownContentClient";

/**
 * Structured interface representing the set of doc content items loaded into the dropdown:
 * - groups: all doc folder paths
 * - docs: root-level individual doc pages
 */
interface IDocsContent {
  groups: string[];
  docs: IDocPost[];
}

/**
 * Processes doc data into the format needed for the dropdown.
 * Extracts root-level folders and docs, and sorts them.
 */
const processDocsContent = (
  foldersData: any[] | undefined,
  docsData: any[] | undefined,
): IDocsContent => {
  // Extract unique group paths from folders
  // Folders have a path field like "guides/api" - we extract all parent paths
  const groupPaths = new Set<string>();
  (foldersData || []).forEach((folder: any) => {
    if (folder.path) {
      // Extract all parent paths (e.g., "guides/api" -> ["guides", "guides/api"])
      const pathParts = folder.path.split("/").filter(Boolean);
      for (let i = 1; i <= pathParts.length; i++) {
        groupPaths.add(pathParts.slice(0, i).join("/"));
      }
    } else if (!folder.parentFolderId) {
      // Root-level folder without path
      groupPaths.add(folder.slug);
    }
  });
  const sortedGroups = Array.from(groupPaths).sort((a, b) =>
    a.localeCompare(b),
  );

  // Get root-level docs (docs without folder) and sort alphabetically by title
  const rootDocs = (docsData || [])
    .filter((doc: IDocPost) => !doc.folderId)
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  return { groups: sortedGroups, docs: rootDocs };
};

/**
 * DocsDropdownContent renders a dropdown panel for the header navigation's "Docs" section.
 * It includes:
 * - Listing doc categories (groups)
 * - Listing root-level individual doc pages
 * - Proper loading, error, and empty states for both
 *
 * This is a server component that fetches data and passes it to a client component for rendering.
 *
 * @component
 * @param isMobile    Whether to render mobile accordion view
 * @param onLinkClick Optional callback to execute when link is clicked (e.g., close sheet)
 * @returns JSX.Element
 */
interface IDocsDropdownContentProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

const DocsDropdownContent = async ({
  isMobile = false,
  onLinkClick,
}: IDocsDropdownContentProps = {}) => {
  try {
    // Fetch doc folders and posts from API
    const [foldersResult, docsResult] = await Promise.all([
      API.docs.getFolders({
        tree: true,
        $page: 1,
        $limit: 10000,
      }),
      API.docs.getAllPublished({
        $page: 1,
        $limit: 10000,
      }),
    ]);

    const foldersData = Array.isArray(foldersResult)
      ? foldersResult
      : foldersResult || [];
    const docsData = Array.isArray(docsResult)
      ? docsResult
      : docsResult?.data || docsResult?.docs || [];

    // Process the fetched data into the format needed for the dropdown
    const docsContent = processDocsContent(foldersData, docsData);

    const { groups, docs } = docsContent;

    // Pass data to client component for rendering
    return (
      <DocsDropdownContentClient
        groups={groups}
        docs={docs}
        isMobile={isMobile}
        onLinkClick={onLinkClick}
      />
    );
  } catch (error) {
    console.error("Error fetching docs dropdown data:", error);
    // Return error state
    return (
      <DocsDropdownContentClient
        groups={[]}
        docs={[]}
        isMobile={isMobile}
        onLinkClick={onLinkClick}
        error={true}
      />
    );
  }
};

export default DocsDropdownContent;
