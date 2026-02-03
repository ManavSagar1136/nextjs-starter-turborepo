import { NextRequest, NextResponse } from "next/server";

/**
 * Waitlist API - Deprecated
 * 
 * Waitlist functionality is now handled by Buildbase SDK.
 * This endpoint is kept for backwards compatibility and redirects to newsletter.
 * 
 * For waitlist management, use the Buildbase SDK:
 * @see https://docs.buildbase.io/waitlist
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    console.log("[Waitlist API] Deprecated endpoint called. Redirecting to newsletter.", {
      email: data.email,
      timestamp: new Date().toISOString(),
    });

    // Redirect to newsletter subscribe endpoint
    const newsletterResponse = await fetch(new URL("/api/public/newsletter", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });

    const result = await newsletterResponse.json();

    return NextResponse.json(
      {
        ...result,
        message: result.success 
          ? "Successfully added to waitlist (redirected to newsletter)" 
          : result.message,
        _deprecated: true,
        _notice: "Waitlist API is deprecated. Use Buildbase SDK for waitlist management.",
      },
      { status: newsletterResponse.status }
    );
  } catch (error) {
    console.error("[Waitlist API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add to waitlist",
        error: error instanceof Error ? error.message : "Unknown error",
        _deprecated: true,
      },
      { status: 500 }
    );
  }
}
