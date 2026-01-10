"use client";

import { SaaSOSProvider, ApiVersion } from "@buildbase/sdk";
import React from "react";
import type { SaaSProviderProps } from "../types";

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
}) => {
  // Read configuration from environment variables
  // In Next.js, NEXT_PUBLIC_* variables are replaced at build time
  const serverUrl = process.env.NEXT_PUBLIC_SAAS_SERVER_URL || "http://localhost:3000";
  const version = ApiVersion.V1;
  const orgId = process.env.NEXT_PUBLIC_SAAS_ORG_ID || "dev-org-id";
  const clientId = process.env.NEXT_PUBLIC_SAAS_CLIENT_ID || "dev-client-id";

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
        } as any,
      }}
    >
      {children}
    </SaaSOSProvider>
  );
};
