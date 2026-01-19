/**
 * Shared path utility functions
 * Used for formatting and manipulating path strings across the application
 */

/**
 * Formats a group/folder path segment into a more human-readable display name.
 * Converts kebab-case paths to Title Case.
 *
 * @param path - Group/folder path (e.g., "tech/react" or "auth/deployment")
 * @returns The formatted name (e.g., "React" or "Deployment")
 *
 * @example
 * formatGroupName("tech/react") // "React"
 * formatGroupName("auth/deployment") // "Deployment"
 * formatGroupName("getting-started") // "Getting Started"
 */
export function formatGroupName(path: string): string {
  const segments = path.split("/");
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment) return path;
  return lastSegment
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
