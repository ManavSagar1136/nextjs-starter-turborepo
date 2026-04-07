import { BaseApiController } from "../base";

export interface BlogFolder {
  id: string;
  name: string;
  slug: string;
  path?: string;
  parentFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogFolderTreeItem {
  id: string;
  name: string;
  slug: string;
  path?: string;
  parentFolderId?: string;
  children: BlogFolderTreeItem[];
}

export interface PaginatedBlogFolders {
  docs: BlogFolder[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export class BlogFolderApis extends BaseApiController {
  protected urlPath = "/blogs/folders";

  async list(options?: { page?: number; limit?: number; search?: string }): Promise<PaginatedBlogFolders> {
    return (await this.get(this.urlPath, options || {})).data;
  }

  async getTree(): Promise<BlogFolderTreeItem[]> {
    return (await this.get(`${this.urlPath}/tree`, {})).data;
  }

  async getById(id: string): Promise<BlogFolder> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data;
  }

  async create(data: { name: string; slug?: string; parentFolderId?: string }): Promise<BlogFolder> {
    return (await this.post<BlogFolder>(this.urlPath, {}, {}, data)).data;
  }

  async update(id: string, data: Partial<BlogFolder>): Promise<BlogFolder> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }
}
