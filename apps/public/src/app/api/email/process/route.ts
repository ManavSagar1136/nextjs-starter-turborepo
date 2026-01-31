import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { EmailService, processQueuedEmail } from "@buildbase/email";

/**
 * POST /api/email/process
 * QStash webhook endpoint for processing queued emails
 * 
 * This endpoint is called by QStash when a queued email is ready to be sent.
 * QStash signature verification is handled by processQueuedEmail.
 * 
 * No authentication required - QStash signature verification is used instead
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize EmailService if needed
    if (!EmailService.isInitialized()) {
      await EmailService.initialize(prisma);
    }

    // Process the queued email (includes signature verification)
    const result = await processQueuedEmail(request);

    if (!result.success) {
      // Return error status to trigger QStash retry
      const status = result.error === "Invalid signature" ? 401 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: result.provider,
    });
  } catch (error) {
    console.error("[Email Process] Failed to process queued email:", error);
    
    // Return 500 to trigger QStash retry
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/process
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "email-queue-processor",
    timestamp: new Date().toISOString(),
  });
}
