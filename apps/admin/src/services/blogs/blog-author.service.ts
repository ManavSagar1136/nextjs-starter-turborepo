import { BaseApiController } from "../base";

export interface BlogAuthor {
  id: string;
  name: string;
  username: string;
  image?: string;
  links?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedBlogAuthors {
  docs: BlogAuthor[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export class BlogAuthorApis extends BaseApiController {
  protected urlPath = "/blogs/authors";

  async list(options?: { page?: number; limit?: number; search?: string }): Promise<PaginatedBlogAuthors> {
    return (await this.get(this.urlPath, options || {})).data;
  }

  async getById(id: string): Promise<BlogAuthor> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data;
  }

  async create(data: {
    name: string;
    username: string;
    image?: string;
    links?: Record<string, string>;
  }): Promise<BlogAuthor> {
    return (await this.post<BlogAuthor>(this.urlPath, {}, {}, data)).data;
  }

  async update(id: string, data: Partial<BlogAuthor>): Promise<BlogAuthor> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }
}
