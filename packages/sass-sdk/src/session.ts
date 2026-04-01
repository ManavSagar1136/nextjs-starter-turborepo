/**
 * Session Management
 *
 * Manages the buildbase usage/quota API session securely on the server.
 * The sessionId is stored in an HttpOnly cookie and NEVER exposed to the browser.
 *
 * Session is org-level (no user scope) — created once and proactively refreshed
 * before it expires (< REFRESH_THRESHOLD_SECONDS remaining).
 *
 * Usage in a Next.js Server Component or Server Action:
 *   import { cookies } from "next/headers";
 *   const session = await getOrRefreshSession({ cookieStore: await cookies() });
 *
 * Usage in a Next.js Route Handler:
 *   const session = await getOrRefreshSessionFromRequest(request);
 *   const headers = session.refreshed ? { "Set-Cookie": buildSetCookieHeader(session.session!) } : {};
 */
import { env } from "@buildbase/env";
import { exchangeToken } from "./token-exchange";

export const SESSION_COOKIE_NAME = "saas_session";

/** Refresh proactively when less than 5 minutes remain */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaaSSession {
  sessionId: string;
  /** Unix timestamp in ms when the session expires */
  expiresAt: number;
  orgId?: string;
}

/**
 * Minimal cookie interface — compatible with Next.js `cookies()` from next/headers.
 * Pass `await cookies()` from `next/headers` directly.
 */
export interface CookieStore {
  get(name: string): { name: string; value: string } | undefined;
  set(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
      path?: string;
      expires?: Date;
      maxAge?: number;
    },
  ): void;
  delete(name: string): void;
}

// ─── Parse / Serialize ────────────────────────────────────────────────────────

function parseSession(raw: string): SaaSSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SaaSSession>;
    if (!parsed.sessionId || !parsed.expiresAt) return null;
    return parsed as SaaSSession;
  } catch {
    return null;
  }
}

/**
 * Parse the raw `Cookie` request header string into a SaaSSession.
 * Use this in route handlers where you have access to `request.headers`.
 */
export function parseSessionFromCookieHeader(cookieHeader: string | null): SaaSSession | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName?.trim() === SESSION_COOKIE_NAME) {
      try {
        return parseSession(decodeURIComponent(rest.join("=")));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Build the `Set-Cookie` header value for the session cookie.
 * Pass null to produce a delete (expired) cookie.
 */
export function buildSetCookieHeader(session: SaaSSession | null): string {
  if (!session) {
    return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
  }
  const maxAgeSeconds = Math.floor((session.expiresAt - Date.now()) / 1000);
  const value = encodeURIComponent(JSON.stringify(session));
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${value}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

// ─── CookieStore helpers (Server Components / Server Actions) ─────────────────

export function getSessionFromCookie(cookieStore: CookieStore): SaaSSession | null {
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return parseSession(decodeURIComponent(cookie.value));
}

export function saveSessionToCookie(cookieStore: CookieStore, session: SaaSSession): void {
  const maxAgeSeconds = Math.floor((session.expiresAt - Date.now()) / 1000);
  cookieStore.set(SESSION_COOKIE_NAME, encodeURIComponent(JSON.stringify(session)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(cookieStore: CookieStore): void {
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ─── Session Validity ─────────────────────────────────────────────────────────

export function isSessionExpired(session: SaaSSession): boolean {
  return Date.now() >= session.expiresAt;
}

export function isSessionExpiringSoon(session: SaaSSession): boolean {
  return Date.now() >= session.expiresAt - REFRESH_THRESHOLD_MS;
}

// ─── Session Creation / Refresh ───────────────────────────────────────────────

async function fetchNewSession(baseUrl?: string): Promise<SaaSSession | null> {
  const orgId = env.NEXT_PUBLIC_SAAS_ORG_ID;
  const apiTokenSecret = env.SAAS_API_TOKEN_SECRET ?? env.SAAS_CLIENT_SECRET;

  if (!orgId || !apiTokenSecret) {
    console.error(
      "[SaaSSession] Missing NEXT_PUBLIC_SAAS_ORG_ID or SAAS_API_TOKEN_SECRET. " +
        "Set SAAS_API_TOKEN_SECRET in your server environment.",
    );
    return null;
  }

  const result = await exchangeToken({ token: `${orgId}:${apiTokenSecret}`, baseUrl });

  if (!result.success || !result.sessionId) {
    console.error("[SaaSSession] Token exchange failed:", result.message);
    return null;
  }

  const expiresInMs = (result.expiresIn ?? 2592000) * 1000; // default 30 days per buildbase docs
  return {
    sessionId: result.sessionId,
    expiresAt: Date.now() + expiresInMs,
    orgId: result.orgId,
  };
}

/**
 * Get the current session from a CookieStore, refreshing it if it's expired
 * or expiring within 5 minutes. Call this in Server Components or Server Actions.
 *
 * @example
 * import { cookies } from "next/headers";
 * const { session, refreshed } = await getOrRefreshSession({ cookieStore: await cookies() });
 * if (!session) { ... handle no session ... }
 */
export async function getOrRefreshSession(options: {
  cookieStore: CookieStore;
  baseUrl?: string;
}): Promise<{ session: SaaSSession | null; refreshed: boolean }> {
  const { cookieStore, baseUrl } = options;
  const existing = getSessionFromCookie(cookieStore);

  if (existing && !isSessionExpiringSoon(existing)) {
    return { session: existing, refreshed: false };
  }

  const session = await fetchNewSession(baseUrl);
  if (session) saveSessionToCookie(cookieStore, session);

  return { session, refreshed: true };
}

/**
 * Get the current session from a raw `Cookie` request header, refreshing if needed.
 * Call this in Route Handlers. If refreshed, add the returned `setCookieHeader`
 * to your Response headers.
 *
 * @example
 * const { session, setCookieHeader } = await getOrRefreshSessionFromRequest(request);
 * const headers: HeadersInit = setCookieHeader ? { "Set-Cookie": setCookieHeader } : {};
 * return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...headers } });
 */
export async function getOrRefreshSessionFromRequest(
  request: Request,
  baseUrl?: string,
): Promise<{ session: SaaSSession | null; setCookieHeader: string | null }> {
  const cookieHeader = request.headers.get("cookie");
  const existing = parseSessionFromCookieHeader(cookieHeader);

  if (existing && !isSessionExpiringSoon(existing)) {
    return { session: existing, setCookieHeader: null };
  }

  const session = await fetchNewSession(baseUrl);
  const setCookieHeader = session ? buildSetCookieHeader(session) : null;

  return { session, setCookieHeader };
}
