import type { OnWorkspaceChangeParams } from "@buildbase/sdk/react";

/**
 * SaaS Provider Props
 */
export interface SaaSProviderProps {
  children: React.ReactNode;
  /**
   * OAuth redirect URL — must match your OAuth app configuration.
   */
  redirectUrl: string;
  /**
   * Called when user signs out. Clear the httpOnly session cookie here.
   * Typically calls POST /api/auth/signout.
   */
  onSignOut?: () => void | Promise<void>;

  /**
   * Called after OAuth redirect — exchanges the code for a sessionId.
   * Must call your POST /api/auth/verify endpoint and return { sessionId }.
   */
  handleAuthentication?: (code: string) => Promise<{ sessionId: string }>;

  /**
   * Called for SDK lifecycle events (workspace:changed, user:created, etc.)
   */
  handleEvent?: (eventType: string, data: any) => void | Promise<void>;

  /**
   * Called BEFORE a workspace switch completes.
   * Use to generate tokens, pre-fetch data, or update server state.
   * Receives a single params object: { workspace, user, role }.
   */
  onWorkspaceChange?: (params: OnWorkspaceChangeParams) => Promise<void>;

  /**
   * UI locale for built-in SDK dialogs (workspace settings, billing, etc.).
   * Defaults to 'en'. Supports: en, es, fr, de, ja, zh, hi, ar.
   */
  locale?: "en" | "es" | "fr" | "de" | "ja" | "zh" | "hi" | "ar";

  /**
   * Called on every page refresh to restore the session from your httpOnly cookie.
   * Must call your GET /api/auth/session endpoint and return the sessionId, or null.
   *
   * Required. Without this, page refresh silently logs the user out.
   *
   * @example
   * getSession={async () => {
   *   const res = await fetch('/api/auth/session')
   *   const data = await res.json()
   *   return data.sessionId ?? null
   * }}
   */
  getSession: () => Promise<string | null>;
}
