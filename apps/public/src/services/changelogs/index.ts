import { IPageFilter, PaginationResponse } from "@buildbase/http-client/types";

import { BaseApiPaginationController } from "../base";

export interface IChangelogPost {
  id: string;
  title: string;
  slug: string;
  version: string;
  description?: string | null;
  content: string;
  published: boolean;
  publishedAt?: Date | null;
  releaseDate?: Date | null;
  seoTitle: string;
  seoDescription?: string | null;
  seoKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

export class ChangelogApis extends BaseApiPaginationController<IChangelogPost> {
  protected urlPath: string = "/changelogs";

  /**
   * Get all published changelogs (public)
   */
  async getAllPublished(
    filter: Partial<IPageFilter> & { search?: string } = {},
  ): Promise<PaginationResponse<IChangelogPost>> {
    const query: any = {};
    if (filter.$page) query.$page = filter.$page;
    if (filter.$limit) query.$limit = filter.$limit;
    if (filter.search) query.search = filter.search;

    const response = await this.get(this.urlPath, query, {});
    return response.data.data || response.data;
  }

  /**
   * Get changelog by slug (public)
   */
  async getBySlug(slug: string): Promise<IChangelogPost> {
    const result = await this.get(`${this.urlPath}/${slug}`, {}, {});
    return result.data;
  }
}
