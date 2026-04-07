/**
 * Route constants for User App
 *
 * Centralized route definitions to avoid hardcoding strings throughout the app.
 * Import and use these constants instead of hardcoding route paths.
 *
 * @example
 * ```tsx
 * import { Routes } from "@/data/routes";
 *
 * router.push(Routes.login);
 * export default withClientAuth(MyPage, [], { redirectTo: Routes.login });
 * ```
 */

export const Routes = {
  /**
   * Public routes
   */
  login: "/login",

  /**
   * Protected routes - Dashboard and user features
   */
  dashboard: "/",
  profile: "/profile",
  assets: "/assets",
  apiKeys: "/settings/api-keys",

  /**
   * API routes
   */
  api: {
    auth: {
      verify: "/api/auth/verify",
      logout: "/api/auth/logout",
      workspaceEvent: "/api/auth/workspace-event",
    },
  },
} as const;

/**
 * Type for route values
 */
export type Route = (typeof Routes)[keyof typeof Routes] | string;
