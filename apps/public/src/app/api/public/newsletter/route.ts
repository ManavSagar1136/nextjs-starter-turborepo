import { NextRequest, NextResponse } from "next/server";
import type { NewsletterSubscribeRequest } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const data: NewsletterSubscribeRequest = await request.json();

    // Log the request
    console.log("[Newsletter API] Received newsletter subscription:", {
      email: data.email,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement database storage here
    // TODO: Implement email sending logic here

    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed to newsletter",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Newsletter API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to subscribe to newsletter",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
