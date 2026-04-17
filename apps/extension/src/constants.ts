/**
 * Mirrors WORKSPACE_ROLES from @buildbase/database/user.
 * Defined locally because @buildbase/database pulls in Prisma (Node.js-only)
 * and cannot be imported in a browser extension bundle.
 */
export const WORKSPACE_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[keyof typeof WORKSPACE_ROLES];
