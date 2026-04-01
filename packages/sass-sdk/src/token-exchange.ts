/**
 * Token Exchange
 * Server-side utility to exchange an API token (orgId:secret) for a session ID.
 * Use this on your backend — the sessionId is then passed in x-session-id header
 * for all subsequent usage/quota API calls.
 */
import { env } from "@buildbase/env";

export interface TokenExchangeConfig {
  /**
   * API token in the format "orgId:apiTokenSecret"
   */
  token: string;
  /**
   * Optional user ID to scope the session to a specific user
   */
  userId?: string;
  /**
   * Optional workspace ID to verify membership
   */
  workspaceId?: string;
  /**
   * Session TTL in seconds (max 2592000 = 30 days). Defaults to 86400 (1 day).
   */
  expiresIn?: number;
  /**
   * Override the Buildbase server URL (defaults to NEXT_PUBLIC_SAAS_SERVER_URL)
   */
  baseUrl?: string;
}

export interface TokenExchangeResponse {
  success: boolean;
  sessionId?: string;
  expiresIn?: number;
  userId?: string;
  orgId?: string;
  message?: string;
}

/**
 * Exchange an API token for a session ID.
 * Call this once on your backend and cache the sessionId for reuse.
 *
 * @example
 * const { sessionId } = await exchangeToken({
 *   token: `${orgId}:${apiSecret}`,
 *   userId: "user123",
 * });
 */
export const exchangeToken = async (config: TokenExchangeConfig): Promise<TokenExchangeResponse> => {
  const { token, userId, workspaceId, expiresIn, baseUrl = env.NEXT_PUBLIC_SAAS_SERVER_URL as string } = config;

  if (!token) {
    return { success: false, message: "No token provided" };
  }

  if (!baseUrl) {
    return { success: false, message: "No baseUrl configured (set NEXT_PUBLIC_SAAS_SERVER_URL)" };
  }

  try {
    const body: Record<string, unknown> = { token };
    if (userId) body.userId = userId;
    if (workspaceId) body.workspaceId = workspaceId;
    if (expiresIn !== undefined) body.expiresIn = expiresIn;

    const response = await fetch(`${baseUrl}/api/v1/public/token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { success: false, message: `Token exchange failed (${response.status}): ${errorText}` };
    }

    const data = await response.json();

    return {
      success: true,
      sessionId: data.sessionId,
      expiresIn: data.expiresIn,
      userId: data.userId,
      orgId: data.orgId,
    };
  } catch (error) {
    console.error("[exchangeToken] Error:", error);
    return { success: false, message: "Token exchange failed" };
  }
};
