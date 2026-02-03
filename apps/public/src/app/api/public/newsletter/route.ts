import { NextRequest, NextResponse } from "next/server";
import { prisma, createNewsletterSubscriber } from "@buildbase/database";
import { EmailService, sendEmail } from "@buildbase/email";
import type { NewsletterSubscribeRequest } from "@/types/api";

const COMPANY_NAME = process.env.COMPANY_NAME || "Our Company";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(request: NextRequest) {
  try {
    const data: NewsletterSubscribeRequest = await request.json();

    if (!data.email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Extract UTM and tracking data from headers/request
    const sourceIp = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const referrer = request.headers.get("referer") || undefined;
    const url = new URL(request.url);

    // Create or update newsletter subscriber
    const { subscriber, isNew } = await createNewsletterSubscriber(prisma, {
      email: data.email,
      source: "website",
      sourceIp,
      referrer,
      utmSource: url.searchParams.get("utm_source") || undefined,
      utmMedium: url.searchParams.get("utm_medium") || undefined,
      utmCampaign: url.searchParams.get("utm_campaign") || undefined,
      utmTerm: url.searchParams.get("utm_term") || undefined,
      utmContent: url.searchParams.get("utm_content") || undefined,
    });

    // Send welcome email (only for new subscribers)
    if (isNew) {
      try {
        await EmailService.initialize(prisma);

        // Try to send using template, fall back to inline HTML
        const welcomeHtml = data.html?.thankYouHTML || generateWelcomeEmail(data.email);

        await sendEmail({
          to: data.email,
          subject: `Welcome to ${COMPANY_NAME} Newsletter!`,
          html: welcomeHtml,
        });

        // Notify admin if configured
        if (ADMIN_EMAIL) {
          await sendEmail({
            to: ADMIN_EMAIL,
            subject: `New Newsletter Subscriber: ${data.email}`,
            html: generateAdminNotificationEmail(data.email, subscriber.source || "website"),
          });
        }
      } catch (emailError) {
        // Log email error but don't fail the subscription
        console.error("[Newsletter API] Failed to send welcome email:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isNew 
          ? "Successfully subscribed to newsletter" 
          : "You are already subscribed to our newsletter",
        data: {
          isNew,
          email: subscriber.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Newsletter API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to subscribe to newsletter",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function generateWelcomeEmail(email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Welcome to ${COMPANY_NAME}!</h1>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>You'll now receive updates about:</p>
      <ul>
        <li>Latest news and announcements</li>
        <li>Product updates and features</li>
        <li>Tips and best practices</li>
        <li>Exclusive offers</li>
      </ul>
      <p>If you didn't subscribe to this newsletter, you can <a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #2563eb;">unsubscribe here</a>.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
      </p>
    </body>
    </html>
  `;
}

function generateAdminNotificationEmail(email: string, source: string): string {
  const adminUrl = process.env.ADMIN_URL || "";
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>New Newsletter Subscriber</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Source:</strong> ${source}</p>
      <p><strong>Date:</strong> ${new Date().toISOString()}</p>
      ${adminUrl ? `<p><a href="${adminUrl}/newsletter/subscribers" style="color: #2563eb;">View in Admin Panel</a></p>` : ""}
    </body>
    </html>
  `;
}
