import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Centralized environment variable schema using @t3-oss/env-nextjs
 * All environment variables used across the monorepo should be defined here
 *
 * Server variables: Only available on the server side
 * Client variables: Exposed to both client and server (must be prefixed with NEXT_PUBLIC_)
 *
 * Note: This works in both Next.js apps and Node.js packages.
 * - Next.js apps: Automatically loads .env files from project root
 * - Packages: process.env is populated by the parent Next.js app or system env vars
 */
export const env = createEnv({
  /**
   * Server-side environment variables
   * These are only available in API routes, server components, and server actions
   * In packages, these are available when running in Node.js context
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Database
    // Make optional during build - will be required at runtime when database is actually used
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL").optional(),

    // API Configuration
    API_SECRET: z.string().min(32).optional(),
    APP_JWT_SECRET: z.string().min(2).optional(),

    // SaaS SDK (Server-side only - secrets should never be exposed to client)
    SAAS_CLIENT_SECRET: z.string().optional(),

    // Cache (Redis/Upstash)
    // Both are optional, but if URL is provided, token should also be provided
    // This is validated in the cache package's validate-env script
    UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL").optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    // Optional: Cache Configuration
    ENABLE_CACHE_WARMING: z.enum(["true", "false"]).optional(),
    CACHE_WARMING_INTERVAL: z.string().regex(/^\d+$/).optional(),

    // QStash (Upstash Message Queue)
    // All are optional, but token and signing keys are required for full functionality
    QSTASH_TOKEN: z.string().min(1).optional(),
    QSTASH_URL: z.string().url("QSTASH_URL must be a valid URL").optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),
  },

  /**
   * Client-side environment variables
   * These are exposed to the browser (must be prefixed with NEXT_PUBLIC_)
   * Only available in Next.js apps, not in packages
   */
  client: {
    // App-specific URLs (for client components)
    NEXT_PUBLIC_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_USER_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_ADMIN_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_DOCS_APP_URL: z.string().url().optional(),

    // SaaS SDK Configuration
    NEXT_PUBLIC_SAAS_SERVER_URL: z.string().url().optional(),
    NEXT_PUBLIC_SAAS_ORG_ID: z.string().optional(),
    NEXT_PUBLIC_SAAS_CLIENT_ID: z.string().optional(),

    // API Secret
    NEXT_PUBLIC_API_SECRET: z.string().optional(),
  },

  /**
   * Runtime environment variables mapping
   * Maps process.env values to the schema
   * Works in both Next.js apps and Node.js packages
   */
  runtimeEnv: {
    // Server
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,

    // Client-side  App URLs (for different apps)
    NEXT_PUBLIC_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_PUBLIC_APP_URL,
    NEXT_PUBLIC_USER_APP_URL: process.env.NEXT_PUBLIC_USER_APP_URL,
    NEXT_PUBLIC_ADMIN_APP_URL: process.env.NEXT_PUBLIC_ADMIN_APP_URL,
    NEXT_PUBLIC_DOCS_APP_URL: process.env.NEXT_PUBLIC_DOCS_APP_URL,

    API_SECRET: process.env.API_SECRET,
    NEXT_PUBLIC_API_SECRET: process.env.NEXT_PUBLIC_API_SECRET,
    APP_JWT_SECRET: process.env.APP_JWT_SECRET,

    SAAS_CLIENT_SECRET: process.env.SAAS_CLIENT_SECRET,
    // SaaS SDK
    NEXT_PUBLIC_SAAS_SERVER_URL: process.env.NEXT_PUBLIC_SAAS_SERVER_URL,
    NEXT_PUBLIC_SAAS_ORG_ID: process.env.NEXT_PUBLIC_SAAS_ORG_ID,
    NEXT_PUBLIC_SAAS_CLIENT_ID: process.env.NEXT_PUBLIC_SAAS_CLIENT_ID,

    // Cache (Redis/Upstash)
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ENABLE_CACHE_WARMING: process.env.ENABLE_CACHE_WARMING,
    CACHE_WARMING_INTERVAL: process.env.CACHE_WARMING_INTERVAL,

    // QStash (Upstash Message Queue)
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
  },

  /**
   * Skip validation in certain environments
   * Useful for CI/CD or when you want to validate later
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Custom error handling
   */
  onValidationError: error => {
    console.error("❌ Invalid environment variables:", error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  },

  /**
   * Custom success message (only in development)
   */
  onInvalidAccess: (key: string) => {
    throw new Error(`❌ Attempted to access invalid environment variable: ${key}`);
  },
});
