/**
 * CSRF Protection
 *
 * Stateless double-submit pattern with HMAC binding:
 *   token = HMAC-SHA256(userId + ":" + workspaceId, APP_JWT_SECRET)
 *
 * The token is set as a readable (non-HttpOnly) cookie so browser JS can read it
 * and attach it as the `x-csrf-token` request header.
 *
 * On every non-GET request, withPermissionCheck:
 *   1. Decodes the auth JWT → extracts userId + workspaceId
 *   2. Recomputes the expected HMAC
 *   3. Compares to the x-csrf-token header value
 *
 * An attacker who sets both cookie and header to the same fake value is still blocked —
 * the server recomputes from the JWT claims and the secret, so the value must be
 * derived from APP_JWT_SECRET which is never exposed to the client.
 */

import { createHmacSigner } from "@buildbase/crypto";
import { NextResponse } from "next/server";
import { env, isProduction, getEnvironment } from "@buildbase/env";

const getCsrfCookieName = (): string => `${getEnvironment()}-cms-csrf`;

export const CSRF_COOKIE_NAME = getCsrfCookieName();
export const CSRF_HEADER_NAME = "x-csrf-token";

/** CSRF cookie lifetime matches the auth token (7 days). */
const CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Generate a CSRF token bound to the user + workspace.
 * Returns a hex-encoded HMAC-SHA256 digest.
 */
export function generateCsrfToken(userId: string, workspaceId: string): string {
  const secret = env.APP_JWT_SECRET;
  if (!secret) return "no-secret";
  return createHmacSigner(secret).sign(`${userId}:${workspaceId}`);
}

export function verifyCsrfToken(token: string | null | undefined, userId: string, workspaceId: string): boolean {
  if (!token) return false;
  const secret = env.APP_JWT_SECRET;
  if (!secret) return false;
  return createHmacSigner(secret).verify(`${userId}:${workspaceId}`, token);
}

/**
 * Attach the CSRF cookie to a response.
 * Call this wherever you set the auth cookie (login, workspace-change).
 *
 * The cookie is intentionally NOT HttpOnly — browser JS must read it to attach
 * it as the x-csrf-token header on each mutating request.
 */
export function setCsrfCookie<T>(response: NextResponse<T>, userId: string, workspaceId: string): NextResponse<T> {
  const token = generateCsrfToken(userId, workspaceId);
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by browser JS
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: CSRF_MAX_AGE_SECONDS,
  });
  return response;
}

/**
 * Clear the CSRF cookie (call on logout alongside clearAuthTokenCookie).
 */
export function clearCsrfCookie<T>(response: NextResponse<T>): NextResponse<T> {
  response.cookies.set(CSRF_COOKIE_NAME, "", {
    httpOnly: false,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
