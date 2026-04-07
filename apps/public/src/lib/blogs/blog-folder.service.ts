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
   * Flatten tree structure, computing full paths from hierarchy.
   * The DB tree uses `children` (not `subFolders`) and `path` may be null for nested folders.
   */
  private static flattenFolders(folders: any[], parentPath = ""): any[] {
    const result: any[] = [];
    folders.forEach((folder) => {
      const computedPath = folder.path || (parentPath ? `${parentPath}/${folder.slug}` : folder.slug);
      const nested = folder.children || folder.subFolders;
      const { children, subFolders: _sf, ...rest } = folder;
      result.push({ ...rest, _fullPath: computedPath });
      if (nested?.length) {
        result.push(...this.flattenFolders(nested, computedPath));
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
      const allFolders = Array.isArray(folders) ? folders : [];

      const flatFolders = this.flattenFolders(allFolders);
      const normalised = path.toLowerCase();
      const found = flatFolders.find((f) => {
        const fp = (f._fullPath || f.path || f.slug || "").toLowerCase();
        return fp === normalised;
      });

      return found || null;
    } catch (error) {
      console.error("Error getting folder by path:", error);
      return null;
    }
  }

  /**
   * Find a folder in the tree while preserving its children array.
   * Computes full path from hierarchy when `path` field is null.
   */
  private static findInTree(folders: any[], targetPath: string, parentPath = ""): any | null {
    for (const folder of folders) {
      const computedPath = folder.path || (parentPath ? `${parentPath}/${folder.slug}` : folder.slug);
      if (computedPath.toLowerCase() === targetPath.toLowerCase()) {
        return { ...folder, _fullPath: computedPath };
      }
      const nested = folder.children || folder.subFolders;
      if (nested?.length) {
        const found = this.findInTree(nested, targetPath, computedPath);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Get a folder by path WITH its immediate subFolders intact.
   */
  static async getFolderWithChildren(
    path: string,
  ): Promise<(IBlogFolder & { subFolders: IBlogFolder[] }) | null> {
    try {
      const folders = await API.blogs.getFolders({ tree: true });
      const tree = Array.isArray(folders) ? folders : [];
      const found = this.findInTree(tree, path);
      if (!found) return null;
      // Normalise children → subFolders for the front-end
      const children = found.children || found.subFolders || [];
      return { ...found, subFolders: children };
    } catch {
      return null;
    }
  }

  /**
   * List all folders (flat list)
   */
  static async listFolders(includeDeleted = false): Promise<IBlogFolder[]> {
    try {
      const folders = await API.blogs.getFolders({ tree: true });
      const allFolders = Array.isArray(folders) ? folders : [];
      return this.flattenFolders(allFolders);
    } catch (error) {
      console.error("Error listing folders:", error);
      return [];
    }
  }
}
