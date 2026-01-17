/**
 * BlogFolderService - API-based implementation
 * Uses API calls instead of direct Prisma access
 */

import { API } from "@/services";
import type { IBlogFolder } from "@/services/blogs";

export interface CreateBlogFolderInput {
  name: string;
  slug?: string;
  parentFolderId?: string | null;
}

export interface UpdateBlogFolderInput {
  name?: string;
  slug?: string;
  parentFolderId?: string | null;
}

export class BlogFolderService {
  /**
   * Flatten tree structure to find folder by path
   */
  private static flattenFolders(folders: any[]): any[] {
    const result: any[] = [];
    folders.forEach((folder) => {
      // Create a copy without subFolders to avoid circular references
      const { subFolders, ...folderWithoutSubFolders } = folder;
      result.push(folderWithoutSubFolders);
      if (subFolders && Array.isArray(subFolders) && subFolders.length > 0) {
        result.push(...this.flattenFolders(subFolders));
      }
    });
    return result;
  }

  /**
   * Get folder by path
   */
  static async getFolderByPath(
    path: string,
    includeDeleted = false,
  ): Promise<IBlogFolder | null> {
    try {
      const folders = await API.blogs.getFolders({ tree: true });
      const allFolders = Array.isArray(folders) ? folders : folders || [];

      // Flatten tree structure to find folder
      const flatFolders = this.flattenFolders(allFolders);
      
      // Try exact match first, then case-insensitive
      const found = flatFolders.find(
        (f) => {
          const folderPath = f.path || f.slug || "";
          const folderSlug = f.slug || "";
          return folderPath === path || folderSlug === path ||
                 folderPath.toLowerCase() === path.toLowerCase() ||
                 folderSlug.toLowerCase() === path.toLowerCase();
        }
      );
      
      return found || null;
    } catch (error) {
      console.error("Error getting folder by path:", error);
      return null;
    }
  }

  /**
   * List all folders (flat list)
   */
  static async listFolders(includeDeleted = false): Promise<IBlogFolder[]> {
    try {
      const folders = await API.blogs.getFolders({ tree: true });
      const allFolders = Array.isArray(folders) ? folders : folders || [];

      // Flatten tree structure
      return this.flattenFolders(allFolders);
    } catch (error) {
      console.error("Error listing folders:", error);
      return [];
    }
  }
}
