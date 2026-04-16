/**
 * POST /api/saas/notification/send
 *
 * Server-side proxy for sending notifications via Buildbase.
 * Reads the SaaS session from the HttpOnly cookie and calls
 * bb.withSession(sessionId).notification.send(workspaceId, eventSlug, userId?, data?)
 *
 * Expected body:
 * {
 *   workspaceId: string,
 *   eventSlug: string,
 *   userId?: string,
 *   data?: Record<string, unknown>
 * }
 *
 * Returns: NotificationResult
 */
import { getOrRefreshSessionFromRequest } from "@buildbase/saas-sdk";
import { bb } from "@buildbase/saas-sdk/server";

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

function buildHeaders(setCookieHeader: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;
  return headers;
}

export async function POST(request: Request): Promise<Response> {
  const { session, setCookieHeader } = await getOrRefreshSessionFromRequest(request);

  if (!session) {
    return json({ error: "No active session. Ensure SAAS_API_TOKEN_SECRET is configured." }, 401);
  }

  let body: {
    workspaceId?: string;
    eventSlug?: string;
    userId?: string;
    data?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { workspaceId, eventSlug, userId, data } = body;

  if (!workspaceId || !eventSlug) {
    return json({ error: "workspaceId and eventSlug are required" }, 400);
  }

  try {
    const result = await bb.withSession(session.sessionId).notification.send(workspaceId, eventSlug, userId, data);
    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: buildHeaders(setCookieHeader),
    });
  } catch (err) {
    console.error("[notification/send] Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    let status = 502;
    if (/unauthorized/i.test(message)) status = 401;
    else if (/forbidden/i.test(message)) status = 403;
    else if (/not found/i.test(message)) status = 404;
    return new Response(
      JSON.stringify({ success: false, error: status === 502 ? "Failed to send notification" : message }),
      { status, headers: buildHeaders(setCookieHeader) }
    );
  }
}
