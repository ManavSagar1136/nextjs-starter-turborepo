import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { getTrackingService, getTransparentPixel } from "@buildbase/email";

type RouteContext = { params: Promise<{ trackingId: string }> };

/**
 * GET /api/track/open/[trackingId]
 * Tracking pixel endpoint - records email opens
 * Returns a 1x1 transparent GIF
 * 
 * No authentication required - this is embedded in emails
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { trackingId } = await context.params;

    // Don't track if it's a "notrack" ID
    if (!trackingId.startsWith("notrack_")) {
      // Get request info for tracking
      const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
        || request.headers.get("x-real-ip") 
        || "unknown";
      const userAgent = request.headers.get("user-agent") || undefined;

      // Record the open event
      const trackingService = getTrackingService(prisma);
      await trackingService.recordOpen(trackingId, {
        ipAddress,
        userAgent,
      });
    }

    // Return transparent 1x1 pixel
    const pixel = getTransparentPixel();
    const pixelArray = new Uint8Array(pixel);

    return new NextResponse(pixelArray, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": pixel.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("[Tracking] Failed to record open:", error);
    
    // Still return the pixel even if tracking fails
    const pixel = getTransparentPixel();
    const pixelArray = new Uint8Array(pixel);
    return new NextResponse(pixelArray, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": pixel.length.toString(),
      },
    });
  }
}
