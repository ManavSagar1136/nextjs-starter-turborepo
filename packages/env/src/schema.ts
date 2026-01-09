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
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

    // App URLs (for different environments)
    PUBLIC_APP_URL: z.string().url().optional(),
    USER_APP_URL: z.string().url().optional(),
    ADMIN_APP_URL: z.string().url().optional(),
    DOCS_APP_URL: z.string().url().optional(),

    // API Configuration
    API_URL: z.string().url().optional(),
    API_SECRET: z.string().min(32).optional(),

    // Authentication
    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(32).optional(),

    // Third-party Services
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),

    // Feature Flags
    ENABLE_ANALYTICS: z
      .string()
      .transform(val => val === "true")
      .optional()
      .default("false"),
    ENABLE_DEBUG: z
      .string()
      .transform(val => val === "true")
      .optional()
      .default("false"),
  },

  /**
   * Client-side environment variables
   * These are exposed to the browser (must be prefixed with NEXT_PUBLIC_)
   * Only available in Next.js apps, not in packages
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_ENABLE_ANALYTICS: z
      .string()
      .transform(val => val === "true")
      .optional()
      .default("false"),
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
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL,
    USER_APP_URL: process.env.USER_APP_URL,
    ADMIN_APP_URL: process.env.ADMIN_APP_URL,
    DOCS_APP_URL: process.env.DOCS_APP_URL,
    API_URL: process.env.API_URL,
    API_SECRET: process.env.API_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
    ENABLE_DEBUG: process.env.ENABLE_DEBUG,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
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
