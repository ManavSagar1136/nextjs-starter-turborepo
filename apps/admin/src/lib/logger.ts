/**
 * App-specific logger instance for the admin app
 */

import { createLogger } from "@buildbase/logger";
import { env } from "@buildbase/env";

export const logger = createLogger({
  serviceName: env.NEW_RELIC_APP_NAME || "admin-app",
  level: env.LOG_LEVEL || "info",
  newRelic: {
    enabled: env.NEW_RELIC_ENABLED === "true",
  },
  base: {
    app: "admin",
  },
});

export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

export const loggers = {
  auth: createModuleLogger("auth"),
  api: createModuleLogger("api"),
  db: createModuleLogger("database"),
};
