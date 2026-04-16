"use client";

import { SaaSProvider as BaseSaaSProvider } from "@buildbase/saas-sdk";
import React from "react";
import { API } from "@/services";
import { env } from "@buildbase/env";
import { Routes } from "@/data/routes";

interface SaaSProviderProps {
  children: React.ReactNode;
}

export default function SaaSProvider({ children }: SaaSProviderProps) {
  // Get base URL from environment variable
  // Use NEXT_PUBLIC_* variable for client components
  const baseUrl = env.NEXT_PUBLIC_ADMIN_APP_URL;
  const redirectUrl = `${baseUrl}${Routes.login}`;

  return (
    <BaseSaaSProvider
      redirectUrl={redirectUrl}
      getSession={async () => {
        const session = await API.auth.getSession();
        return (session as { sessionId?: string }).sessionId ?? null;
      }}
      onSignOut={async () => {
        // Clear auth cookie by calling logout endpoint
        try {
          await API.auth.logout();
        } catch (error) {
          console.error("Error during logout:", error);
        }
        window.location.reload();
      }}
      handleAuthentication={async (code: string) => {
        try {
          const data = await API.auth.verify(code);
          console.log("Authentication data:", data);
          if (data.success && data.sessionId) {
            // Token is stored in HTTP-only cookie automatically
            return { sessionId: data.sessionId };
          } else {
            throw new Error(data.message || "Authentication failed");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Authentication failed";
          throw new Error(errorMessage);
        }
      }}
      // Admin app doesn't handle workspace events
      handleEvent={(eventType: string, data: any) => {
        console.log("[Admin SaaSProvider] Event received:", eventType, data);
        // Admin app doesn't need to handle workspace events
      }}
    >
      {children}
    </BaseSaaSProvider>
  );
}
