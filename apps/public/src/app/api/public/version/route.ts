import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Log the request
    console.log("[Version API] Received version request:", {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          version: process.env.npm_package_version || "1.0.0",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Version API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get version",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
