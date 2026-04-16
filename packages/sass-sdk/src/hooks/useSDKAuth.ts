"use client";

import { useSaaSAuth } from "@buildbase/sdk/react";

/**
 * Return type for useSDKAuth hook
 */
export interface UseSDKAuthReturn {
  // Direct SDK properties
  user: ReturnType<typeof useSaaSAuth>["user"];
  /** Full session object — { user, sessionId }. null when not authenticated. */
  session: ReturnType<typeof useSaaSAuth>["session"];
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True when the SDK is in the process of redirecting for OAuth sign-in. */
  isRedirecting: boolean;
  /** Full AuthStatus enum value — use AuthStatus.Authenticated etc. for comparisons. */
  status: ReturnType<typeof useSaaSAuth>["status"];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;

  // Enhanced user data with fallbacks
  userId: string | undefined;
  userName: string | undefined;
  userEmail: string | undefined;
  userRole: string | undefined;
  userImage: string | undefined;

  // Status helpers
  isReady: boolean;
  hasUser: boolean;

  // Workspace settings dialog
  openWorkspaceSettings: ReturnType<typeof useSaaSAuth>["openWorkspaceSettings"];
  /** Opens the Buildbase subscription/billing dialog directly. */
  openSubscriptionSettings: () => void;
}

/**
 * Enhanced authentication hook that wraps useSaaSAuth from @buildbase/sdk.
 * Provides a clean interface with convenience properties.
 *
 * Note: For role-specific checks (isAdmin, isEditor, etc.), apps should
 * import role constants from @buildbase/database and perform their own checks
 * based on their specific needs (APP_ROLES vs WORKSPACE_ROLES).
 */
export function useSDKAuth(): UseSDKAuthReturn {
  const sdkAuth = useSaaSAuth();

  return {
    // Direct SDK properties
    user: sdkAuth.user,
    session: sdkAuth.session,
    isAuthenticated: sdkAuth.isAuthenticated,
    isLoading: sdkAuth.isLoading,
    isRedirecting: sdkAuth.isRedirecting,
    status: sdkAuth.status,
    signIn: sdkAuth.signIn,
    signOut: sdkAuth.signOut,

    // Enhanced user data with fallbacks
    userId: sdkAuth.user?.id,
    userName: sdkAuth.user?.name,
    userEmail: sdkAuth.user?.email,
    userRole: sdkAuth.user?.role,
    userImage: sdkAuth.user?.image,

    // Status helpers
    isReady: !sdkAuth.isLoading,
    hasUser: !!sdkAuth.user,

    // Workspace settings dialog
    openWorkspaceSettings: sdkAuth.openWorkspaceSettings,
    openSubscriptionSettings: () => sdkAuth.openWorkspaceSettings("subscription"),
  };
}
