import { IBlogTag } from "@/services/blogs";

import { adaptTag } from "@/lib/blogs/blog-adapter";
import { API } from "@/services";

import { BlogDropdownContentClient } from "./BlogDropdownContentClient";

/**
 * Structured interface representing the set of blog content items loaded into the dropdown:
 * - tags: all tag objects
 * - groups: all blog group (category) slugs
 */
interface IBlogContent {
  tags: IBlogTag[];
  groups: string[];
}

/**
 * Processes blog data into the format needed for the dropdown.
 * Sorts tags and extracts unique group paths from folders (categories).
 */
const processBlogContent = (tagsData: any[] | undefined, foldersData: any[] | undefined): IBlogContent => {
  // Convert API tags to UI format and sort alphabetically by title.
  const tags = (tagsData || []).map((tag: any) => adaptTag(tag));
  const sortedTags = tags.sort((a: IBlogTag, b: IBlogTag) => a.title.localeCompare(b.title));

  // Extract unique group paths from folders (categories)
  // Folders have a path field like "tech/react" - we extract all parent paths
  const groupPaths = new Set<string>();
  (foldersData || []).forEach((folder: any) => {
    if (folder.path) {
      // Extract all parent paths (e.g., "tech/react" -> ["tech", "tech/react"])
      const pathParts = folder.path.split("/").filter(Boolean);
      for (let i = 1; i <= pathParts.length; i++) {
        groupPaths.add(pathParts.slice(0, i).join("/"));
      }
    }
  });
  const sortedGroups = Array.from(groupPaths).sort((a, b) => a.localeCompare(b));

  return { tags: sortedTags, groups: sortedGroups };
};

/**
 * BlogDropdownContent renders a dropdown panel for the header navigation's "Blogs" section.
 * It includes:
 * - Listing blog categories (groups)
 * - Listing blog topics (tags)
 * - Proper loading, error, and empty states for both
 *
 * This is a server component that fetches data and passes it to a client component for rendering.
 *
 * @component
 * @param isMobile    Whether to render mobile accordion view
 * @param onLinkClick Optional callback to execute when link is clicked (e.g., close sheet)
 * @returns JSX.Element
 */
interface IBlogDropdownContentProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

const BlogDropdownContent = async ({ isMobile = false, onLinkClick }: IBlogDropdownContentProps = {}) => {
  try {
    // Fetch blog tags and folders (categories) from API
    const [tagsResult, foldersResult] = await Promise.all([
      API.blogs.getTags({
        $page: 1,
        $limit: 10000,
      }),
      API.blogs.getFolders({
        tree: true,
      }),
    ]);

    const tagsData = Array.isArray(tagsResult) ? tagsResult : tagsResult || [];
    const foldersData = Array.isArray(foldersResult) ? foldersResult : foldersResult || [];

    // Process the fetched data into the format needed for the dropdown
    const blogContent = processBlogContent(tagsData, foldersData);

    const { tags, groups } = blogContent;

    // Pass data to client component for rendering
    return <BlogDropdownContentClient tags={tags} groups={groups} isMobile={isMobile} onLinkClick={onLinkClick} />;
  } catch (error) {
    console.error("Error fetching blog dropdown data:", error);
    // Return error state
    return (
      <BlogDropdownContentClient tags={[]} groups={[]} isMobile={isMobile} onLinkClick={onLinkClick} error={true} />
    );
  }
};

export default BlogDropdownContent;
