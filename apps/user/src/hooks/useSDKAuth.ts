"use client";

import { useSDKAuth as useBaseSDKAuth, useSaaSWorkspaces } from "@buildbase/saas-sdk";
import { WORKSPACE_ROLES } from "@buildbase/database";
import { useUser } from "@/store/hooks";

/**
 * Enhanced authentication hook for user app with workspace role checks.
 *
 * Workspace role is read from the Redux store (populated from our JWT's `workspaceRole`
 * field), NOT from `sdkAuth.user?.role` which is the APP_ROLE ("user"/"admin") and
 * would never match workspace role constants.
 *
 * `activeWorkspaceId` — the workspace ID to use for data fetching.
 * Returns null while switching workspaces or before a workspace is loaded.
 * Pages should use this (not workspaceId from the store directly) as the
 * TanStack Query key and enabled guard so queries reset to loading on
 * workspace change and only fire once the new workspace is fully ready:
 *
 * @example
 * const { activeWorkspaceId } = useSDKAuth();
 * useTanstackQuery({
 *   queryKey: ["resource", activeWorkspaceId],
 *   queryFn: fetchResource,
 *   enabled: !!activeWorkspaceId,
 * });
 */
export function useSDKAuth() {
  const baseAuth = useBaseSDKAuth();
  const storeUser = useUser();
  const { switching } = useSaaSWorkspaces();

  // Prefer the store's workspaceRole (kept in sync by SaaSProvider + useInitWorkspace).
  // Fall back to null so permission checks fail safely rather than defaulting to viewer.
  const workspaceRole = storeUser.workspaceRole ?? null;

  // null during switching or before workspace is set → queries stay disabled and
  // reset their cache key, then re-fire automatically once the value becomes non-null.
  const activeWorkspaceId = switching ? null : (storeUser.workspaceId ?? null);

  return {
    ...baseAuth,
    workspaceRole,
    isAdmin: workspaceRole === WORKSPACE_ROLES.ADMIN,
    isEditor: workspaceRole === WORKSPACE_ROLES.EDITOR,
    isViewer: workspaceRole === WORKSPACE_ROLES.VIEWER,
    /** True while the SDK is switching workspaces. */
    isWorkspaceSwitching: switching,
    /**
     * Workspace ID for data fetching. Null during switching or before workspace loads.
     * Use as queryKey segment and `enabled: !!activeWorkspaceId`.
     */
    activeWorkspaceId,
  };
}
