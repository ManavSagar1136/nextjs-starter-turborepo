import { ApiController } from "./controller";
import { IPageFilter, PaginationResponse, HttpClientConfig } from "./types";

/**
 * Sort directions
 */
export const SORT_DIRECTIONS = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type ISortDirection = (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS];

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

  /**
   * Converts a filter object with OR/AND conditions to flat query params format
   * Example: { OR: [{ status: "SCHEDULED", scheduledAt: { $gte: date } }] }
   * Converts to: { "filter[OR][0][status]": "SCHEDULED", "filter[OR][0][scheduledAt][$gte]": date }
   */
  private flattenFilterToQueryParams(filterObj: any, prefix: string = "filter"): Record<string, any> {
    const params: Record<string, any> = {};

    if (!filterObj || typeof filterObj !== "object") {
      return params;
    }

    // Handle OR array
    if (Array.isArray(filterObj.OR)) {
      filterObj.OR.forEach((condition: any, index: number) => {
        Object.entries(condition).forEach(([key, value]) => {
          if (value && typeof value === "object" && !Array.isArray(value)) {
            // Nested object like { $gte: date, $lte: date } or { $notIn: [...] }
            Object.entries(value as Record<string, any>).forEach(([op, opValue]) => {
              // Handle $notIn and $in as arrays - pass as comma-separated string for simpler parsing
              if (op === "$notIn" || op === "$in") {
                if (Array.isArray(opValue)) {
                  // Pass array as comma-separated string
                  params[`${prefix}[OR][${index}][${key}][${op}]`] = opValue.join(",");
                } else {
                  params[`${prefix}[OR][${index}][${key}][${op}]`] = opValue;
                }
              } else {
                params[`${prefix}[OR][${index}][${key}][${op}]`] = opValue;
              }
            });
          } else {
            // Direct value
            params[`${prefix}[OR][${index}][${key}]`] = value;
          }
        });
      });
    }

    // Handle AND array
    if (Array.isArray(filterObj.AND)) {
      filterObj.AND.forEach((condition: any, index: number) => {
        Object.entries(condition).forEach(([key, value]) => {
          if (value && typeof value === "object" && !Array.isArray(value)) {
            // Nested object like { $gte: date, $lte: date }
            Object.entries(value as Record<string, any>).forEach(([op, opValue]) => {
              params[`${prefix}[AND][${index}][${key}][${op}]`] = opValue;
            });
          } else {
            // Direct value
            params[`${prefix}[AND][${index}][${key}]`] = value;
          }
        });
      });
    }

    // Handle regular fields (non-OR/AND)
    Object.entries(filterObj).forEach(([key, value]) => {
      if (key !== "OR" && key !== "AND") {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          // Check if it's an operation object like { $gte: date }
          const hasOperationKeys = Object.keys(value).some(k => k.startsWith("$"));
          if (hasOperationKeys) {
            // It's an operation object
            Object.entries(value as Record<string, any>).forEach(([op, opValue]) => {
              // Handle $notIn and $in as arrays - pass as comma-separated string for simpler parsing
              if (op === "$notIn" || op === "$in") {
                if (Array.isArray(opValue)) {
                  // Pass array as comma-separated string
                  params[`${prefix}[${key}][${op}]`] = opValue.join(",");
                } else {
                  params[`${prefix}[${key}][${op}]`] = opValue;
                }
              } else {
                params[`${prefix}[${key}][${op}]`] = opValue;
              }
            });
          } else {
            // Regular nested object - recursively flatten
            const nested = this.flattenFilterToQueryParams(value, `${prefix}[${key}]`);
            Object.assign(params, nested);
          }
        } else {
          // Direct value
          params[`${prefix}[${key}]`] = value;
        }
      }
    });

    return params;
  }

  private buildPageQueryParams(filter: Partial<IPageFilter>, includePagination: boolean = true) {
    const sort: { [key: string]: -1 | 1 | 0 } = {};
    if (filter.sorting) {
      filter.sorting.map(_sort => {
        sort[_sort.id] = _sort.desc ? -1 : 1;
      });
    }

    const params: any = {
      populate: filter.populate || [],
      sort: sort,
    };

    // Flatten filter object to query params format if it contains OR/AND
    if (filter.filter && Object.keys(filter.filter).length > 0) {
      const flattenedFilter = this.flattenFilterToQueryParams(filter.filter);
      Object.assign(params, flattenedFilter);
    }

    if (includePagination) {
      params.$limit = filter.$limit || 10;
      params.$page = filter.$page || 1;
    } else {
      params.pagination = false;
    }

    if (filter.groupBy) {
      params.groupBy = filter.groupBy;
    }

    return params;
  }

  /**
   * Create default empty pagination response for error cases
   */
  private createEmptyPaginationResponse(): PaginationResponse<T> {
    return {
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
      groups: undefined,
    };
  }

  private async makeGetPageRequest(
    filter: Partial<IPageFilter>,
    url: string | undefined,
    includePagination: boolean,
    errorMessage: string
  ): Promise<PaginationResponse<T>> {
    try {
      const sort: {
        [key: string]: -1 | 1 | 0;
      } = {};
      if (filter?.sorting) {
        filter?.sorting.map(_sort => {
          sort[_sort.id] = _sort.desc ? -1 : 1;
        });
      }
      const response = await this.get(
        url ?? `${this.urlPath}`,
        this.buildPageQueryParams(filter, includePagination),
        {}
      );
      return response.data;
    } catch (err) {
      console.error(errorMessage, {
        url,
        filter,
        error: err,
      });
      return this.createEmptyPaginationResponse();
    }
  }

  async getPage(filter: Partial<IPageFilter> = {}, url?: string): Promise<PaginationResponse<T>> {
    return this.makeGetPageRequest(filter, url, true, "Error getting page");
  }

  async getAll(filter: Partial<IPageFilter> = {}, url?: string): Promise<PaginationResponse<T>> {
    return this.makeGetPageRequest(filter, url, false, "Error getting all");
  }

  async getChart(filter: any, url?: string) {
    const response = await this.get(url ? url : `${this.urlPath}/chart`, filter, {});
    return response.data;
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
