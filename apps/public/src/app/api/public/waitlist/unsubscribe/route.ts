import { NextRequest, NextResponse } from "next/server";

/**
 * Waitlist Unsubscribe API - Deprecated
 * 
 * Waitlist functionality is now handled by Buildbase SDK.
 * This endpoint is kept for backwards compatibility and redirects to newsletter unsubscribe.
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    console.log("[Waitlist Unsubscribe API] Deprecated endpoint called. Redirecting to newsletter unsubscribe.", {
      email: data.email,
      timestamp: new Date().toISOString(),
    });

    // Redirect to newsletter unsubscribe endpoint
    const unsubscribeResponse = await fetch(new URL("/api/public/newsletter/unsubscribe", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, token: data.token }),
    });

    const result = await unsubscribeResponse.json();

    return NextResponse.json(
      {
        ...result,
        _deprecated: true,
        _notice: "Waitlist API is deprecated. Use Buildbase SDK for waitlist management.",
      },
      { status: unsubscribeResponse.status }
    );
  } catch (error) {
    console.error("[Waitlist Unsubscribe API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to unsubscribe from waitlist",
        error: error instanceof Error ? error.message : "Unknown error",
        _deprecated: true,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");

  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ email, token }),
    headers: { "Content-Type": "application/json" },
  });

  return POST(fakeRequest);
}
