import { NextRequest, NextResponse } from "next/server";
import type { WaitlistUnsubscribeRequest } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const data: WaitlistUnsubscribeRequest = await request.json();

    // Log the request
    console.log("[Waitlist Unsubscribe API] Received unsubscribe request:", {
      email: data.email,
      token: data.token ? "provided" : "not provided",
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement database update here
    // TODO: Implement email sending logic here

    return NextResponse.json(
      {
        success: true,
        message: "Successfully unsubscribed from waitlist",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Waitlist Unsubscribe API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to unsubscribe from waitlist",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
