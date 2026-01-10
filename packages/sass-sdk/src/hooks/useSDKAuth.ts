"use client";

import { useSaaSAuth } from "@buildbase/sdk";

/**
 * Return type for useSDKAuth hook
 */
export interface UseSDKAuthReturn {
  // Direct SDK properties
  user: ReturnType<typeof useSaaSAuth>["user"];
  isAuthenticated: boolean;
  isLoading: boolean;
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
}

/**
 * Enhanced authentication hook that leverages the Buildbase SDK
 * This provides a clean interface without duplicating SDK functionality
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
    isAuthenticated: sdkAuth.isAuthenticated,
    isLoading: sdkAuth.isLoading,
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
  };
}
