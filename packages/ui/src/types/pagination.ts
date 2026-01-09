import { SortingState } from "@tanstack/react-table";

export interface IDataTableFilter {
  [key: string]: any;
}

export interface IPageFilter {
  $limit: number;
  $page: number;
  populate?: {
    path: string;
    select: string;
  }[];
  sorting?: SortingState;
  filter?: IDataTableFilter;
}

export interface PaginationResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}
