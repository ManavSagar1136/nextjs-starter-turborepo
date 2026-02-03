import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  unsubscribeNewsletterByEmail,
  getNewsletterSubscriberByEmail,
  confirmNewsletterSubscriber,
} from "@buildbase/database";
import { EmailService, sendEmail } from "@buildbase/email";
import type { NewsletterUnsubscribeRequest } from "@/types/api";

const COMPANY_NAME = process.env.COMPANY_NAME || "Our Company";

export async function POST(request: NextRequest) {
  try {
    const data: NewsletterUnsubscribeRequest = await request.json();

    if (!data.email && !data.token) {
      return NextResponse.json(
        { success: false, message: "Email or token is required" },
        { status: 400 }
      );
    }

    let subscriber = null;

    // Handle token-based confirmation (for double opt-in flows)
    if (data.token) {
      subscriber = await confirmNewsletterSubscriber(prisma, data.token);
      if (subscriber) {
        return NextResponse.json(
          {
            success: true,
            message: "Email confirmed successfully",
            data: { email: subscriber.email, confirmed: true },
          },
          { status: 200 }
        );
      }
    }

    // Handle email-based unsubscribe
    if (data.email) {
      // Check if subscriber exists
      const existing = await getNewsletterSubscriberByEmail(prisma, data.email);
      
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Email not found in our newsletter list" },
          { status: 404 }
        );
      }

      if (existing.status === "UNSUBSCRIBED") {
        return NextResponse.json(
          {
            success: true,
            message: "You are already unsubscribed from our newsletter",
            data: { email: existing.email },
          },
          { status: 200 }
        );
      }

      // Unsubscribe
      subscriber = await unsubscribeNewsletterByEmail(prisma, data.email);

      if (subscriber) {
        // Send unsubscribe confirmation email
        try {
          await EmailService.initialize(prisma);

          await sendEmail({
            to: subscriber.email,
            subject: `You've been unsubscribed from ${COMPANY_NAME}`,
            html: generateUnsubscribeConfirmationEmail(subscriber.email),
          });
        } catch (emailError) {
          console.error("[Newsletter Unsubscribe API] Failed to send confirmation email:", emailError);
        }

        return NextResponse.json(
          {
            success: true,
            message: "Successfully unsubscribed from newsletter",
            data: { email: subscriber.email },
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: "Unable to process unsubscribe request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Newsletter Unsubscribe API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to unsubscribe from newsletter",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for one-click unsubscribe links
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");

  if (!email && !token) {
    return NextResponse.json(
      { success: false, message: "Email or token parameter is required" },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const fakeRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ email, token }),
    headers: { "Content-Type": "application/json" },
  });

  return POST(fakeRequest);
}

function generateUnsubscribeConfirmationEmail(email: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">You've been unsubscribed</h1>
      <p>We've removed <strong>${email}</strong> from our newsletter list.</p>
      <p>We're sorry to see you go! If you unsubscribed by mistake, you can always <a href="${siteUrl}/newsletter" style="color: #2563eb;">resubscribe here</a>.</p>
      <p>If you have any feedback about why you unsubscribed, we'd love to hear it — just reply to this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
      </p>
    </body>
    </html>
  `;
}
