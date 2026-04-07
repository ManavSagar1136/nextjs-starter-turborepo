import { BaseApiController } from "../base";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt?: string;
  content: string;
  image?: string;
  imageTitle?: string;
  featured: boolean;
  featuredAt?: string;
  published: boolean;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  folderId?: string;
  folder?: { id: string; name: string; slug: string; path?: string };
  authors?: { author: BlogAuthorItem }[];
  tags?: { tag: BlogTagItem }[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogAuthorItem {
  id: string;
  name: string;
  username: string;
  image?: string;
}

export interface BlogTagItem {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
}

export interface PaginatedBlogPosts {
  docs: BlogPost[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}

export class BlogPostApis extends BaseApiController {
  protected urlPath = "/blogs/posts";

  async list(options?: {
    page?: number;
    limit?: number;
    search?: string;
    published?: boolean;
    featured?: boolean;
    folderId?: string;
  }): Promise<PaginatedBlogPosts> {
    return (await this.get(this.urlPath, options || {})).data;
  }

  async getById(id: string): Promise<BlogPost> {
    return (await this.get(`${this.urlPath}/${id}`, {})).data;
  }

  async create(data: Partial<BlogPost>): Promise<BlogPost> {
    return (await this.post<BlogPost>(this.urlPath, {}, {}, data)).data;
  }

  async update(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    return (await this.patch(`${this.urlPath}/${id}`, {}, {}, data)).data;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return (await this.delete(`${this.urlPath}/${id}`, {}, {}, {})).data;
  }

  async updateTags(id: string, tagIds: string[]): Promise<{ success: boolean }> {
    return (await this.patch(`${this.urlPath}/${id}/tags`, {}, {}, { tagIds })).data;
  }

  async updateAuthors(id: string, authorIds: string[]): Promise<{ success: boolean }> {
    return (await this.patch(`${this.urlPath}/${id}/authors`, {}, {}, { authorIds })).data;
  }
}
