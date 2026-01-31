/**
 * App-specific logger instance for the public app
 */

import { createLogger } from "@buildbase/logger";
import { env } from "@buildbase/env";

export const logger = createLogger({
  serviceName: env.NEW_RELIC_APP_NAME || "public-app",
  level: env.LOG_LEVEL || "info",
  newRelic: {
    enabled: env.NEW_RELIC_ENABLED === "true",
  },
  base: {
    app: "public",
  },
});

export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

export const loggers = {
  api: createModuleLogger("api"),
  content: createModuleLogger("content"),
};
