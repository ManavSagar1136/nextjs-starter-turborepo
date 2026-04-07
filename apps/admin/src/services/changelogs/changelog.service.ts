import { BaseApiController } from "../base";

export interface ChangelogPost {
  id: string;
  title: string;
  slug: string;
  version: string;
  description?: string | null;
  content: string;
  published: boolean;
  publishedAt?: string | null;
  releaseDate?: string | null;
  seoTitle?: string;
  seoDescription?: string | null;
  seoKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedChangelogPosts {
  docs: ChangelogPost[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export class ChangelogPostApis extends BaseApiController {
  protected urlPath = "/changelogs/posts";

  async list(options?: {
    page?: number;
    limit?: number;
    search?: string;
    published?: boolean;
  }): Promise<PaginatedChangelogPosts> {
    return (await this.get(this.urlPath, options || {})).data;
  }

  async getById(id: string): Promise<ChangelogPost> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data;
  }

  async create(data: {
    title: string;
    version: string;
    slug: string;
    description?: string | null;
    content: string;
    published?: boolean;
    releaseDate?: string | null;
    seoTitle?: string;
    seoDescription?: string | null;
    seoKeywords?: string[];
  }): Promise<ChangelogPost> {
    return (await this.post<ChangelogPost>(this.urlPath, {}, {}, data)).data;
  }

  async update(id: string, data: Partial<ChangelogPost>): Promise<ChangelogPost> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }
}
