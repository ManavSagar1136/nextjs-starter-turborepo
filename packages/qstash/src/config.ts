import { env } from "@buildbase/env";
import type { QStashConfig } from "./types";

// Re-export QStashConfig for convenience
export type { QStashConfig } from "./types";

// Default QStash configuration factory
export const createQStashConfig = (options?: {
  qstashToken?: string;
  qstashUrl?: string;
  currentSigningKey?: string;
  nextSigningKey?: string;
}): QStashConfig => {
  return {
    token: options?.qstashToken || env.QSTASH_TOKEN || "",
    url: options?.qstashUrl || env.QSTASH_URL || undefined,
    currentSigningKey: options?.currentSigningKey || env.QSTASH_CURRENT_SIGNING_KEY || "",
    nextSigningKey: options?.nextSigningKey || env.QSTASH_NEXT_SIGNING_KEY || undefined,
  };
};

// Default QStash configuration (uses environment variables)
export const QSTASH_CONFIG: QStashConfig = createQStashConfig();
