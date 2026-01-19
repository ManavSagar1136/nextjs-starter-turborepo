/**
 * DocFolderService - API-based implementation
 * Uses API calls instead of direct Prisma access
 */

import { API } from "@/services";
import type { IDocFolder } from "@/services/docs";

export interface CreateDocFolderInput {
  name: string;
  slug?: string;
  parentFolderId?: string | null;
}

export interface UpdateDocFolderInput {
  name?: string;
  slug?: string;
  parentFolderId?: string | null;
}

export class DocFolderService {
  /**
   * Get folder by path
   */
  static async getFolderByPath(
    path: string,
    includeDeleted = false,
  ): Promise<IDocFolder | null> {
    try {
      const folders = await API.docs.getFolders({ tree: true });
      const allFolders = Array.isArray(folders) ? folders : folders || [];

      // Flatten tree structure to find folder
      const flattenFolders = (folders: any[]): any[] => {
        const result: any[] = [];
        folders.forEach((folder) => {
          // Create a copy without subFolders to avoid circular references
          const { subFolders, ...folderWithoutSubFolders } = folder;
          result.push(folderWithoutSubFolders);
          if (subFolders && Array.isArray(subFolders) && subFolders.length > 0) {
            result.push(...flattenFolders(subFolders));
          }
        });
        return result;
      };

      const flatFolders = flattenFolders(allFolders);
      
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
    } catch (error: any) {
      // Only log non-404 errors
      const errorStatus = error?.status || error?.response?.status || error?.statusCode;
      if (errorStatus !== 404) {
        console.error("Error getting folder by path:", {
          message: error?.message || error?.data?.message || "Unknown error",
          status: errorStatus,
          path,
        });
      }
      return null;
    }
  }

  /**
   * List all folders
   */
  static async listFolders(includeDeleted = false): Promise<IDocFolder[]> {
    try {
      const folders = await API.docs.getFolders({ tree: true });
      const allFolders = Array.isArray(folders) ? folders : folders || [];

      // Flatten tree structure and remove duplicates by id
      const flattenFolders = (folders: IDocFolder[]): IDocFolder[] => {
        const result: IDocFolder[] = [];
        const seenIds = new Set<string>();
        
        const processFolder = (folder: IDocFolder) => {
          // Skip if we've already seen this folder
          if (seenIds.has(folder.id)) {
            return;
          }
          seenIds.add(folder.id);
          
          // Create a copy without subFolders to avoid circular references
          const { subFolders, ...folderWithoutSubFolders } = folder;
          result.push(folderWithoutSubFolders);
          
          // Process subfolders recursively
          if (subFolders && Array.isArray(subFolders) && subFolders.length > 0) {
            subFolders.forEach((subFolder) => processFolder(subFolder));
          }
        };
        
        folders.forEach((folder) => processFolder(folder));
        return result;
      };

      return flattenFolders(allFolders);
    } catch (error) {
      console.error("Error listing folders:", error);
      return [];
    }
  }
}
