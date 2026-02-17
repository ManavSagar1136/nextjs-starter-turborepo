"use client";

import React from "react";
import { ShieldX } from "lucide-react";
import { ErrorData } from "@buildbase/ui/components/ui/data-state-error";
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
      <div className="w-full max-w-lg">
        <ErrorData
          title="Access Denied"
          description={
            <div className="space-y-2">
              <p>You don't have permission to access this page.</p>
              {userRole && allowedRoles.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  Your role: <span className="font-medium">{userRole}</span>
                  {allowedRoles.length > 0 && <> • Required: {allowedRoles.join(", ")}</>}
                </p>
              )}
            </div>
          }
          variant="default"
          showImage={false}
          icon={<ShieldX className="text-destructive size-12" />}
          additionalActions={[
            {
              variant: "outline",
              onClick: handleGoBack,
              children: "Go Back",
            },
            {
              variant: "default",
              onClick: handleGoHome,
              children: "Go Home",
            },
          ]}
        />
      </div>
    </div>
  );
};
