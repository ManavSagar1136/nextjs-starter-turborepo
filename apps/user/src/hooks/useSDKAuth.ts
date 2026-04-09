"use client";

import { useSDKAuth as useBaseSDKAuth } from "@buildbase/saas-sdk";
import { WORKSPACE_ROLES } from "@buildbase/database";
import { useUser } from "@/store/hooks";

/**
 * Enhanced authentication hook for user app with workspace role checks.
 *
 * Workspace role is read from the Redux store (populated from our JWT's `workspaceRole`
 * field), NOT from `sdkAuth.user?.role` which is the APP_ROLE ("user"/"admin") and
 * would never match workspace role constants.
 */
export function useSDKAuth() {
  const baseAuth = useBaseSDKAuth();
  const storeUser = useUser();

  // Prefer the store's workspaceRole (kept in sync by SaaSProvider + useInitWorkspace).
  // Fall back to null so permission checks fail safely rather than defaulting to viewer.
  const workspaceRole = storeUser.workspaceRole ?? null;

  return {
    ...baseAuth,
    workspaceRole,
    isAdmin: workspaceRole === WORKSPACE_ROLES.ADMIN,
    isEditor: workspaceRole === WORKSPACE_ROLES.EDITOR,
    isViewer: workspaceRole === WORKSPACE_ROLES.VIEWER,
  };
}
