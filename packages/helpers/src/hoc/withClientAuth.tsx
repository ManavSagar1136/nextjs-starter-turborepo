"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthRole } from "../hooks/use-auth";

/**
 * Options for withClientAuth HOC
 */
export interface WithClientAuthOptions {
  /**
   * Redirect path when user is not authenticated
   * @default "/login"
   */
  redirectTo?: string;
  /**
   * Custom loading component to show while checking authentication
   */
  loadingComponent?: React.ComponentType;
}

/**
 * Higher Order Component that wraps a component to ensure it only renders
 * when the user is authenticated and has the required role(s).
 * If the user is not authenticated, they will be redirected to the login page.
 *
 * @param WrappedComponent - The component to wrap
 * @param allowedRoles - Array of allowed roles (defaults to empty array, meaning any authenticated user)
 * @param options - Configuration options for the HOC
 * @returns A new component that enforces authentication and role-based access
 *
 * @example
 * ```tsx
 * // Protect component for any authenticated user
 * export const ProtectedComponent = withClientAuth(MyComponent);
 *
 * // Protect component for specific roles
 * export const AdminComponent = withClientAuth(MyComponent, [APP_ROLES.ADMIN]);
 *
 * // With custom redirect and loading component
 * export const CustomComponent = withClientAuth(MyComponent, [], {
 *   redirectTo: "/custom-login",
 *   loadingComponent: CustomLoader,
 * });
 * ```
 */
export function withClientAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[] = [],
  options: WithClientAuthOptions = {}
) {
  const { redirectTo = "/login", loadingComponent: LoadingComponent } = options;

  const ComponentWithAuth = (props: P) => {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthRole(allowedRoles);

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isAuthenticated, isLoading, router, redirectTo]);

    if (isLoading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
            Loading...
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect via useEffect
    }

    return <WrappedComponent {...props} />;
  };

  ComponentWithAuth.displayName = `withClientAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return ComponentWithAuth;
}
