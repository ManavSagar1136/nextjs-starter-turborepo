import { ApiController } from "@buildbase/http-client/controller";
import { ApiPaginationController } from "@buildbase/http-client/pagination";
import { HttpClientConfig } from "@buildbase/http-client/types";

/**
 * Default HTTP client configuration for docs app
 */
const getDefaultConfig = (): HttpClientConfig => {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return {
    serverUrl: `${baseUrl}/api`,
    secretKey: process.env.NEXT_PUBLIC_SAAS_CLIENT_SECRET || "your-client-secret-here",
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
  constructor(config?: HttpClientConfig) {
    super(config || getDefaultConfig());
  }
}

/**
 * Base Pagination API Controller that automatically uses the default config
 * Extend this class instead of ApiPaginationController to avoid passing config
 */
export abstract class BaseApiPaginationController<T> extends ApiPaginationController<T> {
  constructor(config?: HttpClientConfig) {
    super(config || getDefaultConfig());
  }
}
