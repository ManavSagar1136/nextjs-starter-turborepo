import { BaseApiController } from "../base";

export interface BlogTag {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedBlogTags {
  docs: BlogTag[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export class BlogTagApis extends BaseApiController {
  protected urlPath = "/blogs/tags";

  async list(options?: {
    page?: number;
    limit?: number;
    search?: string;
    isPublic?: boolean;
  }): Promise<PaginatedBlogTags> {
    return (await this.get(this.urlPath, options || {})).data;
  }

  async getById(id: string): Promise<BlogTag> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data;
  }

  async create(data: { title: string; slug?: string; isPublic?: boolean }): Promise<BlogTag> {
    return (await this.post<BlogTag>(this.urlPath, {}, {}, data)).data;
  }

  async update(id: string, data: Partial<BlogTag>): Promise<BlogTag> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }
}
