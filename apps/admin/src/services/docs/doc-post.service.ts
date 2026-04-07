import { BaseApiController } from "../base";

export interface DocPost {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  content: string;
  order?: number;
  published: boolean;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  folderId?: string;
  folder?: { id: string; name: string; slug: string; path?: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDocPosts {
  docs: DocPost[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export class DocPostApis extends BaseApiController {
  protected urlPath = "/docs/posts";

  async list(options?: {
    page?: number;
    limit?: number;
    search?: string;
    published?: boolean;
    folderId?: string;
  }): Promise<PaginatedDocPosts> {
    return (await this.get(this.urlPath, options || {})).data;
  }

  async getById(id: string): Promise<DocPost> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data;
  }

  async create(data: Partial<DocPost>): Promise<DocPost> {
    return (await this.post<DocPost>(this.urlPath, {}, {}, data)).data;
  }

  async update(id: string, data: Partial<DocPost>): Promise<DocPost> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }
}
