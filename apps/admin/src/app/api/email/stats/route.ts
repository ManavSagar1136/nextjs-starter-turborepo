import { NextRequest, NextResponse } from "next/server";
import { prisma, getSentEmailStats } from "@buildbase/database";
import { withAuth } from "@buildbase/helpers/auth";
import { APP_ROLES } from "@buildbase/database/user";

/**
 * GET /api/email/stats
 * Get email statistics
 * Requires: Admin role
 *
 * Query params:
 * - workspaceId: Filter by workspace
 * - fromDate: Filter from date (ISO string)
 * - toDate: Filter to date (ISO string)
 * - period: Shorthand for date range (today|week|month|year)
 */
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse date range
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    const period = searchParams.get("period");
    if (period) {
      const now = new Date();
      toDate = now;

      switch (period) {
        case "today":
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          fromDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
    } else {
      fromDate = searchParams.get("fromDate") ? new Date(searchParams.get("fromDate")!) : undefined;
      toDate = searchParams.get("toDate") ? new Date(searchParams.get("toDate")!) : undefined;
    }

    const workspaceId = searchParams.get("workspaceId") || undefined;

    // Get sent email stats
    const stats = await getSentEmailStats(prisma, {
      workspaceId,
      fromDate,
      toDate,
    });

    // Get tracking stats (opens, clicks) from EmailEvent
    const trackingStats = await prisma.emailEvent.groupBy({
      by: ["type"],
      _count: { type: true },
      where: {
        timestamp: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      },
    });

    // Transform tracking stats
    const tracking = {
      opens: trackingStats.find(s => s.type === "OPENED")?._count.type || 0,
      uniqueOpens: 0, // Would need distinct trackingId count
      clicks: trackingStats.find(s => s.type === "CLICKED")?._count.type || 0,
      uniqueClicks: 0,
      bounces: trackingStats.find(s => s.type === "BOUNCED")?._count.type || 0,
      complaints: trackingStats.find(s => s.type === "COMPLAINED")?._count.type || 0,
      unsubscribes: trackingStats.find(s => s.type === "UNSUBSCRIBED")?._count.type || 0,
    };

    // Calculate rates
    const rates = {
      deliveryRate: stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(2) : "0",
      openRate: stats.delivered > 0 ? ((tracking.opens / stats.delivered) * 100).toFixed(2) : "0",
      clickRate: stats.delivered > 0 ? ((tracking.clicks / stats.delivered) * 100).toFixed(2) : "0",
      bounceRate: stats.total > 0 ? ((stats.bounced / stats.total) * 100).toFixed(2) : "0",
    };

    return NextResponse.json({
      period: period || "custom",
      dateRange: { from: fromDate?.toISOString(), to: toDate?.toISOString() },
      emails: stats,
      tracking,
      rates,
    });
  } catch (error) {
    console.error("[API] Failed to get email stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}

// Export with auth middleware - Admin only
export const GET = withAuth(handleGET, [APP_ROLES.ADMIN]);
