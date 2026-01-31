import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { getTrackingService } from "@buildbase/email";

/**
 * GET /api/track/click
 * Click tracking endpoint - records link clicks and redirects to target URL
 * 
 * Query params:
 * - id: Tracking ID
 * - url: Target URL (base64 encoded)
 * 
 * No authentication required - links are rewritten in emails
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get("id");
    const encodedUrl = searchParams.get("url");

    // Decode the target URL
    let targetUrl: string;
    try {
      targetUrl = encodedUrl ? Buffer.from(encodedUrl, "base64").toString("utf-8") : "/";
    } catch {
      targetUrl = "/";
    }

    // Validate the URL
    try {
      new URL(targetUrl);
    } catch {
      // If not a valid absolute URL, treat as relative or fallback
      if (!targetUrl.startsWith("/")) {
        targetUrl = "/";
      }
    }

    // Record click if we have a valid tracking ID
    if (trackingId && !trackingId.startsWith("notrack_")) {
      const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "unknown";
      const userAgent = request.headers.get("user-agent") || undefined;

      const trackingService = getTrackingService(prisma);
      await trackingService.recordClick(trackingId, targetUrl, {
        ipAddress,
        userAgent,
      });
    }

    // Redirect to target URL
    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    console.error("[Tracking] Failed to record click:", error);
    
    // Redirect to homepage on error
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }
}
