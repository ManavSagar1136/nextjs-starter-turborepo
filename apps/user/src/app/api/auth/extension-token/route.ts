import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession, AUTH_TOKEN_COOKIE_NAME } from "@buildbase/helpers/auth";

/**
 * GET /api/auth/extension-token
 *
 * Returns the current session JWT in the response body so the browser
 * extension's content script can read it and pass it to the background
 * service worker as x-extension-token.
 *
 * This is intentionally a GET endpoint (immune to CSRF) and is only
 * meaningful to callers who already have the HttpOnly auth cookie
 * (i.e. authenticated users on this domain).
 *
 * The content script runs in the page's security context, so this is
 * a same-origin request — cookies are sent automatically and no
 * cross-origin concerns apply.
 */
export async function GET() {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, token }, { headers: { "Cache-Control": "no-store" } });
}
