import { ApiController } from "./controller";
import { IPageFilter, PaginationResponse, HttpClientConfig } from "./types";

export abstract class ApiPaginationController<T> extends ApiController {
  protected abstract urlPath: string;

  constructor(config: HttpClientConfig) {
    super(config);
  }

  async create<T>(data: Partial<T>): Promise<T> {
    return (await this.post<T>(`${this.urlPath}`, {}, {}, data)).data;
  }

  async update<T>(id: string, data: Partial<T>) {
    return await this.patch(`${this.urlPath}/${id}`, {}, {}, data);
  }

  async remove(id: string) {
    const result = await this.delete(`${this.urlPath}/${id}`, {}, {});
    return result.data;
  }
  async getOne(id: string): Promise<T> {
    return (await this.get(`${this.urlPath}/${id}`, {}, {})).data;
  }

  async getPage(
    filter: IPageFilter,
    url?: string //  used when collection is part of another collection example usersList contains users
  ): Promise<PaginationResponse<T>> {
    const sort: {
      [key: string]: -1 | 1 | 0;
    } = {};
    if (filter.sorting) {
      filter.sorting.map(_sort => {
        sort[_sort.id] = _sort.desc ? -1 : 1;
      });
    }
    try {
      const response = await this.get(
        url ?? `${this.urlPath}`,
        {
          $limit: filter.$limit || 10,
          $page: filter.$page || 1,
          populate: filter.populate || [],
          sort: sort,
          filter: filter.filter,
        },
        {}
      );
      return response.data;
    } catch (err) {
      return Promise.resolve({
        docs: [],
        totalDocs: 0,
        limit: 10,
        totalPages: 0,
        page: 0,
        pagingCounter: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      });
    }
  }

  async getAll(filter: any): Promise<PaginationResponse<T>> {
    try {
      const response = await this.get(`${this.urlPath}`, {
        filter,
        pagination: false,
      });
      return response.data;
    } catch (err) {
      return Promise.resolve({
        docs: [],
        totalDocs: 0,
        limit: 10,
        totalPages: 0,
        page: 0,
        pagingCounter: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      });
    }
  }
  async getChart(filter: any, url?: string) {
    try {
      const response = await this.get(url ? url : `${this.urlPath}/chart`, filter);
      return response.data;
    } catch (err) {
      return Promise.resolve([]);
    }
  }

  async getCounts(filter: { from: string; to: string }, previous: boolean = false) {
    try {
      const response = await this.get(`${this.urlPath}/counts`, {
        filter,
        previous,
      });
      return response.data as {
        current: number;
        previous: number;
      };
    } catch (err) {
      return Promise.resolve({
        current: 0,
        previous: 0,
      });
    }
  }
}
