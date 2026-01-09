export interface IRequestHeader {
  responseType?: "json" | "arraybuffer" | "blob" | "document" | "text" | "stream";
  [key: string]: any;
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
  sorting?: Array<{
    id: string;
    desc: boolean;
  }>;
  filter?: IDataTableFilter;
}

export interface HttpClientConfig {
  serverUrl: string;
  secretKey?: string;
  encryptData?: boolean;
  storageKeys?: {
    TOKEN: string;
  };
  // Legacy support
  SECRET_KEY?: string;
  ENCRYPT_DATA?: boolean;
}
