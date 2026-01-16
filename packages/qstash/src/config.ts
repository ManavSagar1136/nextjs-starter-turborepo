/* eslint-disable @typescript-eslint/no-explicit-any */
import type { QStashConfig } from "./types";

// Default QStash configuration factory
export const createQStashConfig = (options?: {
  qstashToken?: string;
  qstashUrl?: string;
  currentSigningKey?: string;
  nextSigningKey?: string;
}): QStashConfig => {
  return {
    token: options?.qstashToken || process.env.QSTASH_TOKEN || "",
    url: options?.qstashUrl || process.env.QSTASH_URL || undefined,
    currentSigningKey: options?.currentSigningKey || process.env.QSTASH_CURRENT_SIGNING_KEY || "",
    nextSigningKey: options?.nextSigningKey || process.env.QSTASH_NEXT_SIGNING_KEY || undefined,
  };
};

// Default QStash configuration (uses environment variables)
export const QSTASH_CONFIG: QStashConfig = createQStashConfig();
