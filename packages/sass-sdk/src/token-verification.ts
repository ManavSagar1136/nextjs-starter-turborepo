/**
 * SDK Token Verification
 * Common utility for verifying authentication codes with the Buildbase SDK
 */
import { env } from "@buildbase/env";

export interface SDKTokenVerificationConfig {
  code: string;
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  orgId?: string;
}

export interface SDKTokenVerificationResponse {
  success: boolean;
  sessionId?: string;
  user?: {
    id?: string;
    _id?: string;
    email?: string;
    name?: string;
    image?: string;
    role?: string;
    workspaceId?: string;
    currentWorkspaceId?: string;
    workspaceName?: string;
    [key: string]: any;
  };
  workspaces?: any[];
  message?: string;
}

/**
 * Verify authentication code with Buildbase SDK
 * @param config - Configuration for token verification
 * @returns SDK token verification response
 */
export const verifySDKToken = async (config: SDKTokenVerificationConfig): Promise<SDKTokenVerificationResponse> => {
  const {
    code,
    baseUrl = env.NEXT_PUBLIC_SAAS_SERVER_URL as string,
    clientId = env.NEXT_PUBLIC_SAAS_CLIENT_ID as string,
    clientSecret = env.SAAS_CLIENT_SECRET as string,
    orgId = env.NEXT_PUBLIC_SAAS_ORG_ID as string,
  } = config;

  if (!code) {
    return {
      success: false,
      message: "No code provided",
    };
  }

  try {
    const fetchResponse = await fetch(`${baseUrl}/api/v1/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        clientId,
        clientSecret,
        orgId,
      }),
    });

    if (!fetchResponse.ok) {
      return {
        success: false,
        message: "Failed to verify token",
      };
    }

    const responseData = await fetchResponse.json();
    // Handle both { data: { sessionId, user, workspaces } } and flat { sessionId, user, workspaces }
    const responseResult = responseData.data ?? responseData;
    const sessionId = responseResult.sessionId;
    const userData = responseResult.user;
    const workspaces = responseResult.workspaces || [];

    return {
      success: true,
      sessionId,
      user: userData,
      workspaces,
    };
  } catch (error) {
    console.error("SDK token verification error:", error);
    return {
      success: false,
      message: "Failed to verify token",
    };
  }
};
