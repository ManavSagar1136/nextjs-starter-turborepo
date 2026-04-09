/**
 * Route constants for Admin App
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
   * Protected routes - Dashboard and admin features
   */
  dashboard: "/",
  users: "/users",
  workspaces: "/workspaces",

  /**
   * Email management routes
   */
  email: {
    providers: "/email/providers",
    templates: "/email/templates",
    sent: "/email/sent",
    stats: "/email/stats",
    send: "/email/send",
  },

  /**
   * Asset management routes
   */
  assets: "/assets",

  /**
   * Blog management routes
   */
  blogs: {
    posts: "/blogs/posts",
    folders: "/blogs/folders",
    tags: "/blogs/tags",
    authors: "/blogs/authors",
  },

  /**
   * Docs management routes
   */
  docs: {
    posts: "/docs/posts",
    folders: "/docs/folders",
  },

  /**
   * Changelog management routes
   */
  changelogs: {
    posts: "/changelogs/posts",
  },

  /**
   * API routes
   */
  api: {
    auth: {
      verify: "/api/auth/verify",
      logout: "/api/auth/logout",
    },
  },
} as const;

/**
 * Type for route values
 */
export type Route = (typeof Routes)[keyof typeof Routes] | string;
