import { BaseApiController } from "../base";

export interface DocFolder {
  id: string;
  name: string;
  slug: string;
  path?: string;
  parentFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocFolderTreeItem {
  id: string;
  name: string;
  slug: string;
  path?: string;
  parentFolderId?: string;
  children: DocFolderTreeItem[];
}

export interface PaginatedDocFolders {
  docs: DocFolder[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export class DocFolderApis extends BaseApiController {
  protected urlPath = "/docs/folders";

  async list(options?: { page?: number; limit?: number; search?: string }): Promise<PaginatedDocFolders> {
    return (await this.get(this.urlPath, options || {})).data;
  }

  async getTree(): Promise<DocFolderTreeItem[]> {
    return (await this.get(`${this.urlPath}/tree`, {})).data;
  }

  async getById(id: string): Promise<DocFolder> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data;
  }

  async create(data: { name: string; slug?: string; parentFolderId?: string }): Promise<DocFolder> {
    return (await this.post<DocFolder>(this.urlPath, {}, {}, data)).data;
  }

  async update(id: string, data: Partial<DocFolder>): Promise<DocFolder> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }
}
