import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import { EmailService } from "@buildbase/email";

/**
 * POST /api/email/send
 * Send an email directly or via template
 * Requires: Admin role
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();

    // Initialize EmailService if needed
    if (!EmailService.isInitialized()) {
      await EmailService.initialize(prisma);
    }

    // Validate required fields
    if (!body.to) {
      return NextResponse.json({ error: "Missing required field: to" }, { status: 400 });
    }

    // Send via template
    if (body.templateSlug || body.templateId) {
      if (!body.templateSlug && !body.templateId) {
        return NextResponse.json({ error: "Provide either templateSlug or templateId" }, { status: 400 });
      }

      const result = body.templateSlug
        ? await EmailService.sendTemplate(body.templateSlug, {
            to: body.to,
            variables: body.variables || {},
            from: body.from,
            replyTo: body.replyTo,
            cc: body.cc,
            bcc: body.bcc,
            providerId: body.providerId,
            queue: body.queue,
            delay: body.delay,
            scheduledAt: body.scheduledAt,
          })
        : await EmailService.sendTemplateById(body.templateId, {
            to: body.to,
            variables: body.variables || {},
            from: body.from,
            replyTo: body.replyTo,
            cc: body.cc,
            bcc: body.bcc,
            providerId: body.providerId,
            queue: body.queue,
            delay: body.delay,
            scheduledAt: body.scheduledAt,
          });

      return NextResponse.json(result);
    }

    // Direct send - require subject and content
    if (!body.subject) {
      return NextResponse.json({ error: "Missing required field: subject" }, { status: 400 });
    }
    if (!body.html && !body.text) {
      return NextResponse.json({ error: "Missing required field: html or text" }, { status: 400 });
    }

    const result = await EmailService.send({
      to: body.to,
      subject: body.subject,
      html: body.html,
      text: body.text,
      from: body.from,
      replyTo: body.replyTo,
      cc: body.cc,
      bcc: body.bcc,
      headers: body.headers,
      providerId: body.providerId,
      disableTracking: body.disableTracking,
      queue: body.queue,
      delay: body.delay,
      scheduledAt: body.scheduledAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Failed to send email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}

// Export with auth middleware - Admin only
export const POST = withAuth(handlePOST, [APP_ROLES.ADMIN]);
