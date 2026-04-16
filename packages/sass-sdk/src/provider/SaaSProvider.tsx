"use client";

import { ApiVersion } from "@buildbase/sdk";
import { SaaSOSProvider } from "@buildbase/sdk/react";
import React from "react";
import type { SaaSProviderProps } from "../types";
import { env } from "@buildbase/env";

/**
 * SaaSProvider — wraps SaaSOSProvider, reading config from environment variables.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SAAS_SERVER_URL   Buildbase API server URL
 *   NEXT_PUBLIC_SAAS_ORG_ID       Organisation ID (24-char hex ObjectId)
 *   NEXT_PUBLIC_SAAS_CLIENT_ID    OAuth client ID
 *
 * You must pass getSession — called on every page refresh to restore the session
 * from your httpOnly cookie. Without it, page refresh logs the user out.
 */
export const SaaSProvider: React.FC<SaaSProviderProps> = ({
  children,
  redirectUrl,
  onSignOut,
  getSession,
  handleAuthentication,
  handleEvent,
  onWorkspaceChange,
  locale,
}) => {
  const serverUrl = env.NEXT_PUBLIC_SAAS_SERVER_URL || "http://localhost:3000";
  const version = ApiVersion.V1;
  const orgId = env.NEXT_PUBLIC_SAAS_ORG_ID || "694e99a4e41ec4ca273256e9";
  const clientId = env.NEXT_PUBLIC_SAAS_CLIENT_ID || "dev-client-id";

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
      {...(locale !== undefined && ({ locale } as any))}
      auth={{
        clientId,
        redirectUrl,
        callbacks: {
          getSession,
          // Provide no-op defaults for required SDK callbacks when not configured.
          // In production these should always be set — the no-ops prevent a hard crash
          // if a consumer omits them during development.
          handleAuthentication:
            handleAuthentication ??
            (async () => {
              console.warn("[SaaSProvider] handleAuthentication not configured");
              return { sessionId: "" };
            }),
          // Wrap onSignOut to ensure it always returns Promise<void> as the SDK requires,
          // since our prop type allows void | Promise<void> for consumer convenience.
          onSignOut: onSignOut
            ? async () => {
                await onSignOut();
              }
            : async () => {
                console.warn("[SaaSProvider] onSignOut not configured");
              },
          handleEvent,
          onWorkspaceChange,
        } as any,
      }}
    >
      {children}
    </SaaSOSProvider>
  );
};
