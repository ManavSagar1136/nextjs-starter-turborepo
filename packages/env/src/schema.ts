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
    // Secret part of the "orgId:secret" API token used for usage/quota session exchange
    SAAS_API_TOKEN_SECRET: z.string().optional(),

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

    // Cron Jobs (Vercel Cron)
    CRON_SECRET: z.string().min(1).optional(),

    // Logging & Monitoring
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).optional(),

    // New Relic APM
    NEW_RELIC_ENABLED: z.enum(["true", "false"]).optional(),
    NEW_RELIC_LICENSE_KEY: z.string().min(1).optional(),
    NEW_RELIC_APP_NAME: z.string().min(1).optional(),

    // Storage Provider Configuration
    STORAGE_PROVIDER: z.enum(["gcs", "s3", "local", "azure"]).optional(),

    // Google Cloud Storage
    GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
    GOOGLE_CLOUD_CLIENT_EMAIL: z.string().email().optional(),
    GOOGLE_CLOUD_PRIVATE_KEY: z.string().optional(),
    GOOGLE_CLOUD_BUCKET_NAME: z.string().optional(),

    // AWS S3
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),

    // Local Storage (dev)
    LOCAL_STORAGE_PATH: z.string().optional(),
    LOCAL_STORAGE_URL: z.string().optional(),

    // Email Configuration
    COMPANY_NAME: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_URL: z.string().url().optional(),

    // Email Encryption
    EMAIL_ENCRYPTION_KEY: z.string().min(1).optional(),

    // Vercel Environment (for deployment detection)
    VERCEL_ENV: z.string().optional(),
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

    // Product Launch Status
    NEXT_PUBLIC_PRODUCT_LAUNCHED: z.enum(["true", "false"]).optional(),

    // Affiliate & Marketing Links
    NEXT_PUBLIC_AFFILIATE_PROGRAM_LINK: z.string().url().optional(),
    NEXT_PUBLIC_AFFILIATE_STORE_NAME: z.string().optional(),
    NEXT_PUBLIC_BOOK_MEETING_LINK: z.string().url().optional(),

    // Google Analytics
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),

    // Buildbase plan group slug — used by usePublicPlans() on the pricing page
    // Find this in your Buildbase dashboard under Plan Groups
    NEXT_PUBLIC_PLAN_GROUP_SLUG: z.string().optional(),
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
    SAAS_API_TOKEN_SECRET: process.env.SAAS_API_TOKEN_SECRET,
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

    // Cron Jobs (Vercel Cron)
    CRON_SECRET: process.env.CRON_SECRET,

    // Product Launch Status
    NEXT_PUBLIC_PRODUCT_LAUNCHED: process.env.NEXT_PUBLIC_PRODUCT_LAUNCHED,

    // Affiliate & Marketing Links
    NEXT_PUBLIC_AFFILIATE_PROGRAM_LINK: process.env.NEXT_PUBLIC_AFFILIATE_PROGRAM_LINK,
    NEXT_PUBLIC_AFFILIATE_STORE_NAME: process.env.NEXT_PUBLIC_AFFILIATE_STORE_NAME,
    NEXT_PUBLIC_BOOK_MEETING_LINK: process.env.NEXT_PUBLIC_BOOK_MEETING_LINK,

    // Google Analytics
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,

    // Buildbase plan group slug
    NEXT_PUBLIC_PLAN_GROUP_SLUG: process.env.NEXT_PUBLIC_PLAN_GROUP_SLUG,

    // Logging & Monitoring
    LOG_LEVEL: process.env.LOG_LEVEL,

    // New Relic APM
    NEW_RELIC_ENABLED: process.env.NEW_RELIC_ENABLED,
    NEW_RELIC_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY,
    NEW_RELIC_APP_NAME: process.env.NEW_RELIC_APP_NAME,

    // Storage Provider
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,

    // Google Cloud Storage
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
    GOOGLE_CLOUD_CLIENT_EMAIL: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    GOOGLE_CLOUD_PRIVATE_KEY: process.env.GOOGLE_CLOUD_PRIVATE_KEY,
    GOOGLE_CLOUD_BUCKET_NAME: process.env.GOOGLE_CLOUD_BUCKET_NAME,

    // AWS S3
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,

    // Local Storage
    LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH,
    LOCAL_STORAGE_URL: process.env.LOCAL_STORAGE_URL,

    // Email Configuration
    COMPANY_NAME: process.env.COMPANY_NAME,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_URL: process.env.ADMIN_URL,

    // Email Encryption
    EMAIL_ENCRYPTION_KEY: process.env.EMAIL_ENCRYPTION_KEY,

    // Vercel Environment
    VERCEL_ENV: process.env.VERCEL_ENV,
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
