"use client";

import React from "react";
import { ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Props for AccessDenied component
 */
export interface AccessDeniedProps {
  /**
   * The user's current role
   */
  userRole?: string;
  /**
   * Array of allowed roles
   */
  allowedRoles?: string[];
}

/**
 * Default Access Denied component shown when user doesn't have required role
 * This is a server-safe component that can be used in withServerAuth
 * Uses minimal dependencies (no UI package) to keep helpers package lightweight
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({ userRole, allowedRoles = [] }) => {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-lg">
        <div className="border-destructive/20 bg-background flex flex-col items-center justify-center space-y-6 rounded-lg border p-8 text-center shadow-sm">
          {/* Icon */}
          <div className="bg-destructive/10 flex items-center justify-center rounded-full p-4">
            <ShieldX className="text-destructive size-12" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
            <p className="text-muted-foreground text-sm">You don't have permission to access this page.</p>
            {userRole && allowedRoles.length > 0 && (
              <p className="text-muted-foreground mt-4 text-xs">
                Your role: <span className="font-medium">{userRole}</span>
                {allowedRoles.length > 0 && <> • Required: {allowedRoles.join(", ")}</>}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex w-full max-w-xs flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleGoBack}
              className="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              onClick={handleGoHome}
              className="bg-primary text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
