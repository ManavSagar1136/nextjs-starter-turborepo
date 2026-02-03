import { NextRequest, NextResponse } from "next/server";
import { prisma, unsubscribeNewsletterByEmail } from "@buildbase/database";
import { EmailService, EMAIL_TEMPLATES } from "@buildbase/email";
import type { NewsletterUnsubscribeRequest } from "@/types/api";

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
    const data: NewsletterUnsubscribeRequest = await request.json();

    if (!data.email && !data.token) {
      return NextResponse.json(
        { success: false, message: "Email or token is required" },
        { status: 400 }
      );
    }

    let subscriberEmail: string | null = null;

    if (data.email) {
      // Unsubscribe by email
      const subscriber = await unsubscribeNewsletterByEmail(prisma, data.email);
      
      if (!subscriber) {
        return NextResponse.json(
          { success: false, message: "Email not found in our newsletter list" },
          { status: 404 }
        );
      }

      subscriberEmail = subscriber.email;

      console.log("[Newsletter Unsubscribe API] Unsubscribed:", {
        email: subscriber.email,
        id: subscriber.id,
      });
    } else if (data.token) {
      // TODO: Implement token-based unsubscribe if needed
      // For now, token unsubscribe not implemented
      return NextResponse.json(
        { success: false, message: "Token-based unsubscribe not yet implemented" },
        { status: 501 }
      );
    }

    // Initialize email service
    await initEmail();

    // Send unsubscribe confirmation email
    if (subscriberEmail) {
      try {
        await EmailService.sendTemplate(EMAIL_TEMPLATES.NEWSLETTER_UNSUBSCRIBE, {
          to: subscriberEmail,
          variables: {
            email: subscriberEmail,
            companyName: process.env.COMPANY_NAME || "Our Company",
            resubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || ""}/#newsletter`,
          },
        });
        console.log("[Newsletter Unsubscribe API] Confirmation email sent to:", subscriberEmail);
      } catch (emailError) {
        // Log but don't fail the unsubscription
        console.error("[Newsletter Unsubscribe API] Failed to send confirmation email:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully unsubscribed from newsletter",
      },
      { status: 200 }
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
