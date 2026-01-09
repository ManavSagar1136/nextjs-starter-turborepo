/**
 * Role Constants
 * Centralized role definitions for type safety and consistency across the application
 *
 * Roles are separated into two categories:
 * - APP_ROLES: System-level user permissions (stored in User.role)
 * - WORKSPACE_ROLES: Workspace-level permissions (stored in WorkspaceMember.role)
 */

/**
 * App Roles - System-level user permissions
 * Used in User model for application-wide permissions
 */
export const APP_ROLES = {
  ADMIN: "admin",
  USER: "user", // Default system-level role for users
} as const;

/**
 * Workspace Roles - Workspace-level permissions
 * Used in WorkspaceMember model for workspace-specific permissions
 */
export const WORKSPACE_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer", // Default role for workspace memberships
} as const;

// Default role for new workspace memberships
export const DEFAULT_ROLE = WORKSPACE_ROLES.VIEWER;

// Default app role for new users
export const DEFAULT_APP_ROLE = APP_ROLES.USER;

// Type definitions for type safety
export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[keyof typeof WORKSPACE_ROLES];
export type Role = AppRole | WorkspaceRole; // Union type for backward compatibility
