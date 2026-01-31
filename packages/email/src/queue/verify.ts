/**
 * @buildbase/email - QStash Signature Verification
 * Uses @buildbase/qstash receiver for email processing endpoints
 */

import type { ProcessingResult, QueuePayload } from "./types.js";
import { EmailService } from "../service/email.service.js";

/**
 * Verify and process a QStash email request
 * Use this in your email processing endpoint
 *
 * @example
 * ```typescript
 * // In your API route (e.g., /api/email/process)
 * import { processQueuedEmail } from '@buildbase/email';
 *
 * export async function POST(req: Request) {
 *   const result = await processQueuedEmail(req);
 *
 *   if (!result.success) {
 *     return new Response(JSON.stringify({ error: result.error }), {
 *       status: result.error === 'Invalid signature' ? 401 : 500
 *     });
 *   }
 *
 *   return Response.json(result);
 * }
 * ```
 */
export async function processQueuedEmail(request: Request): Promise<ProcessingResult> {
  try {
    // Verify signature using @buildbase/qstash
    const { createQStashFactory } = await import("@buildbase/qstash/factory");
    const factory = createQStashFactory();
    const receiver = factory.receiver;

    // Clone request to read body twice
    const clonedRequest = request.clone();
    const verification = await receiver.verifyNextRequest(clonedRequest);

    if (!verification.valid) {
      return {
        success: false,
        error: verification.error || "Invalid signature",
      };
    }

    // Parse the payload
    const body = await request.json();
    const payload = body as QueuePayload;

    if (!payload.email) {
      return {
        success: false,
        error: "Invalid payload: missing email",
      };
    }

    // Send the email directly (no queue)
    const result = await EmailService.sendDirect(payload.email);

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
        provider: result.provider,
      };
    } else {
      // Return error to trigger QStash retry
      return {
        success: false,
        error: result.errors?.join(", ") || "Send failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify QStash signature on incoming request (standalone verification)
 *
 * @example
 * ```typescript
 * import { verifyQStashSignature } from '@buildbase/email';
 *
 * const isValid = await verifyQStashSignature(request);
 * if (!isValid) {
 *   return new Response('Unauthorized', { status: 401 });
 * }
 * ```
 */
export async function verifyQStashSignature(request: Request): Promise<boolean> {
  try {
    const { createQStashFactory } = await import("@buildbase/qstash/factory");
    const factory = createQStashFactory();
    const verification = await factory.receiver.verifyNextRequest(request.clone());
    return verification.valid;
  } catch {
    return false;
  }
}

/**
 * Create a Next.js/Express middleware for QStash signature verification
 */
export function createQStashMiddleware() {
  return async (req: Request): Promise<{ valid: boolean; error?: string }> => {
    try {
      const { createQStashFactory } = await import("@buildbase/qstash/factory");
      const factory = createQStashFactory();
      const verification = await factory.receiver.verifyNextRequest(req.clone());

      return {
        valid: verification.valid,
        error: verification.error,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  };
}
