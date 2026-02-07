import { NextRequest, NextResponse } from "next/server";
import { prisma, createNewsletterSubscriber } from "@buildbase/database";
import { EmailService, EMAIL_TEMPLATES } from "@buildbase/email";
import type { NewsletterSubscribeRequest } from "@/types/api";

// Initialize email service
let emailInitialized = false;
async function initEmail() {
  if (!emailInitialized) {
    await EmailService.initialize(prisma);
    emailInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: NewsletterSubscribeRequest = await request.json();

    if (!data.email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Get request metadata
    const sourceIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const referrer = request.headers.get("referer") || undefined;

    // Get UTM params from URL if present
    const url = new URL(request.url);
    const utmSource = url.searchParams.get("utm_source") || undefined;
    const utmMedium = url.searchParams.get("utm_medium") || undefined;
    const utmCampaign = url.searchParams.get("utm_campaign") || undefined;

    // Save to database
    const { subscriber, isNew } = await createNewsletterSubscriber(prisma, {
      email: data.email,
      source: "website",
      sourceIp,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    console.log("[Newsletter API] Subscriber created/found:", {
      email: subscriber.email,
      isNew,
      id: subscriber.id,
    });

    // Initialize email service
    await initEmail();

    // Send welcome email to subscriber
    try {
      await EmailService.sendTemplate(EMAIL_TEMPLATES.NEWSLETTER_WELCOME, {
        to: subscriber.email,
        variables: {
          email: subscriber.email,
          companyName: process.env.COMPANY_NAME || "Our Company",
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "#",
        },
      });
      console.log("[Newsletter API] Welcome email sent to:", subscriber.email);
    } catch (emailError) {
      // Log but don't fail the subscription
      console.error("[Newsletter API] Failed to send welcome email:", emailError);
    }

    // Send admin notification (optional - only if ADMIN_EMAIL is set)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && isNew) {
      try {
        await EmailService.sendTemplate(EMAIL_TEMPLATES.NEWSLETTER_ADMIN_NOTIFICATION, {
          to: adminEmail,
          variables: {
            email: subscriber.email,
            source: "website",
            subscribedAt: new Date().toISOString(),
            adminUrl: process.env.ADMIN_URL || "#",
          },
        });
        console.log("[Newsletter API] Admin notification sent");
      } catch (adminEmailError) {
        console.error("[Newsletter API] Failed to send admin notification:", adminEmailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isNew
          ? "Successfully subscribed to newsletter"
          : "You are already subscribed to our newsletter",
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

