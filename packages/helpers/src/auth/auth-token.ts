import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { isProduction } from "@buildbase/env";
import type { AuthenticatedUser } from "./auth-middleware";

/**
 * Cookie name for authentication token
 * Shared across all apps (admin and user)
 */
export const AUTH_TOKEN_COOKIE_NAME = "cms-auth-token";

const TOKEN_EXPIRY_DAYS = 7;
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * TOKEN_EXPIRY_DAYS;

/**
 * Base cookie options for auth token
 */
const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction(),
  sameSite: "lax" as const,
  path: "/",
} as const;

/**
 * Create a JWT token from user data
 * @param userData - User data to encode in the token
 * @returns JWT token string
 */
export const createAuthToken = (userData: Partial<AuthenticatedUser>): string => {
  const tokenPayload: AuthenticatedUser = {
    ...userData,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
  } as AuthenticatedUser;

  const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-jwt-secret-change-in-production";
  return jwt.sign(tokenPayload, jwtSecret);
};

/**
 * Set or clear auth token cookie in a NextResponse
 * @param response - NextResponse to set/clear the cookie on
 * @param token - JWT token to set, or undefined/null/empty string to clear
 * @returns The same response with cookie set/cleared
 */
export const setAuthTokenCookie = (response: NextResponse, token?: string | null): NextResponse => {
  const tokenValue = token || "";
  response.cookies.set(AUTH_TOKEN_COOKIE_NAME, tokenValue, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: tokenValue ? TOKEN_EXPIRY_SECONDS : 0,
  });
  return response;
};

/**
 * Create a NextResponse with auth token set as HTTP-only cookie
 * @param data - JSON data to return in the response body
 * @param userData - User data to encode in the token
 * @returns NextResponse with token set as cookie
 */
export const withAuthToken = <T = any>(data: T, userData: Partial<AuthenticatedUser>): NextResponse => {
  const token = createAuthToken(userData);
  return setAuthTokenCookie(NextResponse.json(data), token);
};

/**
 * Clear auth token cookie (for logout)
 * @param response - NextResponse to clear the cookie on
 * @returns The same response with cookie cleared
 */
export const clearAuthTokenCookie = (response: NextResponse): NextResponse => {
  return setAuthTokenCookie(response);
};

// Legacy exports for backward compatibility
export const createResponseWithAuthToken = withAuthToken;
