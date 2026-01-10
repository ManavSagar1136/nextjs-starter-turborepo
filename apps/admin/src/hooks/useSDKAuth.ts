"use client";

import { useSDKAuth as useBaseSDKAuth } from "@buildbase/saas-sdk";
import { APP_ROLES } from "@buildbase/database";

/**
 * Enhanced authentication hook for admin app with app role checks
 * Extends the base useSDKAuth hook with app-specific role helpers
 */
export function useSDKAuth() {
  const baseAuth = useBaseSDKAuth();

  return {
    ...baseAuth,
    // App role checks specific to admin app
    isAdmin: baseAuth.userRole === APP_ROLES.ADMIN,
    isUser: baseAuth.userRole === APP_ROLES.USER,
  };
}
