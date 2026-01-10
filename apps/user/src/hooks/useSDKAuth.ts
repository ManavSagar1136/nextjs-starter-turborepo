"use client";

import { useSDKAuth as useBaseSDKAuth } from "@buildbase/saas-sdk";
import { WORKSPACE_ROLES } from "@buildbase/database";

/**
 * Enhanced authentication hook for user app with workspace role checks
 * Extends the base useSDKAuth hook with workspace-specific role helpers
 */
export function useSDKAuth() {
  const baseAuth = useBaseSDKAuth();

  return {
    ...baseAuth,
    // Workspace role checks specific to user app
    isAdmin: baseAuth.userRole === WORKSPACE_ROLES.ADMIN,
    isEditor: baseAuth.userRole === WORKSPACE_ROLES.EDITOR,
    isViewer: baseAuth.userRole === WORKSPACE_ROLES.VIEWER,
  };
}
