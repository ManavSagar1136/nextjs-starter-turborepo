"use client";

import { SaaSOSProvider, ApiVersion } from "@buildbase/sdk";
import React from "react";
import type { SaaSProviderProps } from "../types";
import { env } from "@buildbase/env";

/**
 * SaaSProvider - A wrapper around SaaSOSProvider that reads config from environment variables
 *
 * This component automatically reads SDK configuration from environment variables and
 * allows apps to pass their own callback functions for handling events and authentication.
 */
export const SaaSProvider: React.FC<SaaSProviderProps> = ({
  children,
  redirectUrl,
  onSignOut,
  handleAuthentication,
  handleEvent,
  onWorkspaceChange,
}) => {
  const serverUrl = env.NEXT_PUBLIC_SAAS_SERVER_URL || "http://localhost:3000";
  const version = ApiVersion.V1;
  const orgId = env.NEXT_PUBLIC_SAAS_ORG_ID || "694e99a4e41ec4ca273256e9";
  const clientId = env.NEXT_PUBLIC_SAAS_CLIENT_ID || "dev-client-id";

  // Ensure all required values are strings (not undefined)
  if (!serverUrl || !orgId || !clientId) {
    console.error("[SaaSProvider] Missing required environment variables:", {
      serverUrl: !!serverUrl,
      orgId: !!orgId,
      clientId: !!clientId,
    });
  }

  return (
    <SaaSOSProvider
      serverUrl={serverUrl}
      version={version}
      orgId={orgId}
      auth={{
        clientId: clientId,
        redirectUrl: redirectUrl,
        callbacks: {
          onSignOut,
          handleAuthentication,
          handleEvent,
          onWorkspaceChange,
        } as any,
      }}
    >
      {children}
    </SaaSOSProvider>
  );
};
