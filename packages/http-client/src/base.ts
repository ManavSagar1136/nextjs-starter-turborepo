import https from "https";
import axios, { AxiosProgressEvent, AxiosResponse } from "axios";
import CryptoJS from "crypto-js";
import { env } from "@buildbase/env";

import { IRequestHeader, HttpClientConfig } from "./types";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/gif"];

let globalConfig: HttpClientConfig = {
  serverUrl: "",
  secretKey: env.API_SECRET,
  encryptData: false,
  storageKeys: {
    TOKEN: "token",
  },
};

export const setHttpClientConfig = (config: HttpClientConfig) => {
  globalConfig = {
    ...globalConfig,
    ...config,
  };
};

export const getHttpClientConfig = (): HttpClientConfig => {
  return globalConfig;
};

const handleResponse = <T = any>(data: string, secretKey: string) => {
  const bytes = CryptoJS.AES.decrypt(data, secretKey).toString(CryptoJS.enc.Utf8);
  return JSON.parse(bytes) as T;
};

const encryptData = (data: Object, secretKey: string) => {
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  return {
    v2: true,
    data: encrypted,
  };
};

const request = async (
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
  url: string,
  _query: object,
  headers: IRequestHeader = {},
  data: any | Object | FormData = {},
  fileUpload: boolean = false,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  config?: HttpClientConfig
) => {
  try {
    const requestConfig = config || getHttpClientConfig();
    const secretKey =
      requestConfig.secretKey || requestConfig.SECRET_KEY || "your-client-secret-here";
    const shouldEncrypt = requestConfig.encryptData ?? requestConfig.ENCRYPT_DATA ?? false;

    let body = data;
    let query = _query;
    if (!fileUpload) {
      if (shouldEncrypt) {
        body = encryptData(body, secretKey);
        query = encryptData(query, secretKey);
      }
    }
    const responseType = headers?.responseType ?? "json";
    let finalUrl = url;
    if (url.startsWith("http")) {
      finalUrl = url;
    } else {
      finalUrl = requestConfig.serverUrl + "" + url;
    }
    let httpsAgent: any = null;
    if (requestConfig.serverUrl.includes("base.local.com")) {
      httpsAgent = new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false,
      });
    }
    const response = await axios.request({
      method: method,
      url: finalUrl,
      params: query,
      responseType,
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onUploadProgress) {
          onUploadProgress(progressEvent);
        }
      },
      headers: {
        ...headers,
      },
      httpsAgent: httpsAgent,
      data: body,
    });

    if (!fileUpload && shouldEncrypt) {
      const imageResponse = IMAGE_MIME_TYPES;
      const isFile = imageResponse.includes(response.headers["content-type"]);
      if (!isFile) {
        response.data = handleResponse(response.data.data, secretKey);
      }
    }
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        const response = error.response;
        if (response.data?.error?.name == "TokenExpiredError" || response.data?.error == "Token has expired") {
          // Backend automatically clears the cookie, frontend just needs to refresh
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }
        throw response;
      }
      throw error.response;
    }
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw error;
  }
};

const get = async (url: string, query: object, headers: object = {}, config?: HttpClientConfig) => {
  const result = await request("GET", url, query, headers, {}, false, undefined, config);
  return result;
};

async function post<T>(
  url: string,
  query: any,
  headers: IRequestHeader = {},
  data: T | FormData,
  isFile: boolean = false,
  progress?: (event: AxiosProgressEvent) => void,
  config?: HttpClientConfig
): Promise<AxiosResponse<any>> {
  const result = await request("POST", url, query, headers, data, isFile, progress, config);
  return result;
}

const upload = async (
  url: string,
  query: object,
  headers: IRequestHeader = {},
  data: FormData,
  config?: HttpClientConfig
) => {
  const requestConfig = config || getHttpClientConfig();
  try {
    return await axios.request({
      method: "POST",
      url: requestConfig.serverUrl + "" + url,
      params: query,
      headers: {
        ...headers,
      },
      data: data,
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        const response = error.response;
        if (response.data?.error?.name == "TokenExpiredError" || response.data?.error == "Token has expired") {
          // Backend automatically clears the cookie, frontend just needs to refresh
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }
        return response;
      }
      return error.response;
    }
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw error;
  }
};

const patch = async (
  url: string,
  query: object = {},
  headers: IRequestHeader = {},
  data: object = {},
  config?: HttpClientConfig
) => {
  const result = await request("PATCH", url, query, headers, data, false, undefined, config);
  return result;
};

const put = async (
  url: string,
  query: object = {},
  headers: IRequestHeader = {},
  data: object = {},
  config?: HttpClientConfig
) => {
  const result = await request("PUT", url, query, headers, data, false, undefined, config);
  return result;
};

const _delete = async (
  url: string,
  query: object = {},
  headers: IRequestHeader = {},
  data: object = {},
  config?: HttpClientConfig
) => {
  const result = await request("DELETE", url, query, headers, data, false, undefined, config);
  return result;
};

export { get, post, patch, put, _delete, upload };
