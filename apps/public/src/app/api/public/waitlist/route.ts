import { NextRequest, NextResponse } from "next/server";
import type { WaitlistSubscribeRequest } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const data: WaitlistSubscribeRequest = await request.json();

    // Log the request
    console.log("[Waitlist API] Received waitlist subscription:", {
      email: data.email,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement database storage here
    // TODO: Implement email sending logic here

    return NextResponse.json(
      {
        success: true,
        message: "Successfully added to waitlist",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Waitlist API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add to waitlist",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
