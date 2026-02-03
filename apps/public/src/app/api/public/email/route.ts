import { NextRequest, NextResponse } from "next/server";
import { prisma, createContactSubmission } from "@buildbase/database";
import { EmailService, sendEmail } from "@buildbase/email";
import type { ContactFormData } from "@/types/contact";

const COMPANY_NAME = process.env.COMPANY_NAME || "Our Company";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.email || !data.message) {
      return NextResponse.json(
        { success: false, message: "Email and message are required" },
        { status: 400 }
      );
    }

    // Extract tracking data from headers
    const sourceIp = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const referrer = request.headers.get("referer") || undefined;
    const url = new URL(request.url);

    // Create contact submission in database
    const submission = await createContactSubmission(prisma, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.contactNumber,
      message: data.message,
      source: "website",
      sourceIp,
      referrer,
      pageUrl: referrer,
      utmSource: url.searchParams.get("utm_source") || undefined,
      utmMedium: url.searchParams.get("utm_medium") || undefined,
      utmCampaign: url.searchParams.get("utm_campaign") || undefined,
    });

    // Initialize email service
    try {
      await EmailService.initialize(prisma);

      // Send confirmation email to user
      await sendEmail({
        to: data.email,
        subject: `We received your message - ${COMPANY_NAME}`,
        html: generateUserConfirmationEmail(data),
      });

      // Send notification to admin
      if (ADMIN_EMAIL) {
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `New Contact Form Submission from ${data.firstName || "Website Visitor"}`,
          html: generateAdminNotificationEmail(data, submission.id),
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the submission
      console.error("[Contact API] Failed to send emails:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Contact form submitted successfully. We'll get back to you soon!",
        data: {
          id: submission.id,
          email: submission.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Contact API] Error:", error);
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

function generateUserConfirmationEmail(data: ContactFormData): string {
  const firstName = data.firstName || "there";
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Thanks for reaching out, ${firstName}!</h1>
      <p>We've received your message and will get back to you as soon as possible.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Your message:</h3>
        <p style="white-space: pre-wrap; margin-bottom: 0;">${escapeHtml(data.message)}</p>
      </div>
      <p>In the meantime, feel free to explore our website or follow us on social media.</p>
      <p>Best regards,<br><strong>The ${COMPANY_NAME} Team</strong></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated response. Please do not reply directly to this email.
        <br>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
      </p>
    </body>
    </html>
  `;
}

function generateAdminNotificationEmail(data: ContactFormData, submissionId: string): string {
  const adminUrl = process.env.ADMIN_URL || "";
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Not provided";
  
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">New Contact Form Submission</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">Name:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(fullName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
        </tr>
        ${data.contactNumber ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Phone:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.contactNumber)}</td>
        </tr>
        ` : ""}
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Submitted:</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Message:</h3>
        <p style="white-space: pre-wrap; margin-bottom: 0;">${escapeHtml(data.message)}</p>
      </div>
      
      ${adminUrl ? `
      <p>
        <a href="${adminUrl}/contacts/${submissionId}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View in Admin Panel</a>
      </p>
      ` : ""}
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Submission ID: ${submissionId}
      </p>
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
