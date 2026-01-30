import { NextRequest, NextResponse } from "next/server";
import { prisma, listSentEmails } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";
import type { EmailStatus } from "@buildbase/database";

/**
 * GET /api/email/sent
 * List sent emails with filters
 * Requires: Admin role
 *
 * Query params:
 * - to: Filter by recipient email
 * - from: Filter by sender email
 * - subject: Search in subject
 * - status: Filter by status (QUEUED|SENT|DELIVERED|FAILED|BOUNCED)
 * - providerId: Filter by provider
 * - templateId: Filter by template
 * - fromDate: Filter from date (ISO string)
 * - toDate: Filter to date (ISO string)
 * - page: Page number (default 1)
 * - limit: Items per page (default 20, max 100)
 */
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Parse filters
    const filters = {
      to: searchParams.get("to") || undefined,
      from: searchParams.get("from") || undefined,
      subject: searchParams.get("subject") || undefined,
      status: (searchParams.get("status") as EmailStatus) || undefined,
      providerId: searchParams.get("providerId") || undefined,
      templateId: searchParams.get("templateId") || undefined,
      workspaceId: searchParams.get("workspaceId") || undefined,
      fromDate: searchParams.get("fromDate") ? new Date(searchParams.get("fromDate")!) : undefined,
      toDate: searchParams.get("toDate") ? new Date(searchParams.get("toDate")!) : undefined,
    };

    const { emails, total } = await listSentEmails(prisma, filters, {
      skip,
      take: limit,
      orderBy: "desc",
    });

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API] Failed to list sent emails:", error);
    return NextResponse.json({ error: "Failed to fetch sent emails" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
