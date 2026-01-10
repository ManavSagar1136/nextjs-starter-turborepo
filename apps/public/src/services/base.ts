import { ApiController } from "@buildbase/http-client/controller";
import { ApiPaginationController } from "@buildbase/http-client/pagination";
import { HttpClientConfig } from "@buildbase/http-client/types";
import { env } from "@buildbase/env";
/**
 * Default HTTP client configuration for public app
 */
const getDefaultConfig = (): HttpClientConfig => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : env.NEXT_PUBLIC_PUBLIC_APP_URL;

  return {
    serverUrl: `${baseUrl}/api`,
    secretKey: env.NEXT_PUBLIC_API_SECRET,
    encryptData: false,
    storageKeys: {
      TOKEN: "token",
    },
  };
};

/**
 * Base API Controller that automatically uses the default config
 * Extend this class instead of ApiController to avoid passing config
 */
export abstract class BaseApiController extends ApiController {
  constructor() {
    super(getDefaultConfig());
  }
}

/**
 * Base Pagination API Controller that automatically uses the default config
 * Extend this class instead of ApiPaginationController to avoid passing config
 */
export abstract class BaseApiPaginationController<T> extends ApiPaginationController<T> {
  constructor() {
    super(getDefaultConfig());
  }
}
