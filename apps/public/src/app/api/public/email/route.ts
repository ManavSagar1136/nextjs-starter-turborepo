import { NextRequest, NextResponse } from "next/server";
import { prisma, createContactSubmission } from "@buildbase/database";
import { EmailService, EMAIL_TEMPLATES } from "@buildbase/email";
import type { ContactFormData } from "@/types/contact";

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
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    if (!data.message) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
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
    const submission = await createContactSubmission(prisma, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.contactNumber,
      message: data.message,
      subject: `Contact form submission from ${data.firstName || data.email}`,
      category: "general",
      source: "website",
      sourceIp,
      referrer,
      pageUrl: referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    console.log("[Contact Form API] Submission saved:", {
      id: submission.id,
      email: submission.email,
      timestamp: new Date().toISOString(),
    });

    // Initialize email service
    await initEmail();

    // Send confirmation email to user
    try {
      await EmailService.sendTemplate(EMAIL_TEMPLATES.CONTACT_CONFIRMATION, {
        to: data.email,
        variables: {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email,
          companyName: process.env.COMPANY_NAME || "Our Company",
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "#",
        },
      });
      console.log("[Contact Form API] Confirmation email sent to:", data.email);
    } catch (emailError) {
      // Log but don't fail the submission
      console.error("[Contact Form API] Failed to send confirmation email:", emailError);
    }

    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await EmailService.sendTemplate(EMAIL_TEMPLATES.CONTACT_ADMIN_NOTIFICATION, {
          to: adminEmail,
          variables: {
            firstName: data.firstName || "-",
            lastName: data.lastName || "-",
            email: data.email,
            phone: data.contactNumber || "-",
            subject: `Contact from ${data.firstName || data.email}`,
            message: data.message,
            submittedAt: new Date().toISOString(),
            adminUrl: process.env.ADMIN_URL || "#",
          },
        });
        console.log("[Contact Form API] Admin notification sent");
      } catch (adminEmailError) {
        console.error("[Contact Form API] Failed to send admin notification:", adminEmailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Contact form submitted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Contact Form API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit contact form",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
