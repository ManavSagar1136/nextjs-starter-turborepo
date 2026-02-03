/**
 * @buildbase/database - Create Waitlist Subscriber
 */

import { randomBytes } from "crypto";
import type { PrismaClient, WaitlistSubscriber } from "../generated/client";
import type { CreateWaitlistSubscriberInput } from "./types";

/**
 * Generate a short referral code
 */
function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Get the next position in the waitlist
 */
async function getNextPosition(prisma: PrismaClient, workspaceId?: string): Promise<number> {
  const lastSubscriber = await prisma.waitlistSubscriber.findFirst({
    where: workspaceId ? { workspaceId } : {},
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return (lastSubscriber?.position ?? 0) + 1;
}

/**
 * Create a new waitlist subscriber
 * @returns The created subscriber or existing subscriber if email already exists
 */
export async function createWaitlistSubscriber(
  prisma: PrismaClient,
  data: CreateWaitlistSubscriberInput
): Promise<{ subscriber: WaitlistSubscriber; isNew: boolean; position: number }> {
  const normalizedEmail = data.email.toLowerCase().trim();

  // Check if already exists
  const existing = await prisma.waitlistSubscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    // If previously unsubscribed, resubscribe
    if (existing.status === "UNSUBSCRIBED") {
      const position = await getNextPosition(prisma, data.workspaceId);
      const updated = await prisma.waitlistSubscriber.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          position,
          unsubscribedAt: null,
          subscribedAt: new Date(),
          source: data.source ?? existing.source,
          sourceIp: data.sourceIp ?? existing.sourceIp,
          ...(data.utmSource && { utmSource: data.utmSource }),
          ...(data.utmMedium && { utmMedium: data.utmMedium }),
          ...(data.utmCampaign && { utmCampaign: data.utmCampaign }),
        },
      });
      return { subscriber: updated, isNew: false, position };
    }
    // Already on waitlist
    return { subscriber: existing, isNew: false, position: existing.position ?? 0 };
  }

  // Get next position
  const position = await getNextPosition(prisma, data.workspaceId);

  // Generate referral code if requested
  let referralCode: string | undefined;
  if (data.generateReferralCode) {
    // Ensure uniqueness
    let attempts = 0;
    do {
      referralCode = generateReferralCode();
      const existingCode = await prisma.waitlistSubscriber.findUnique({
        where: { referralCode },
      });
      if (!existingCode) break;
      attempts++;
    } while (attempts < 10);
  }

  // Handle referral
  let referredBy = data.referredBy;
  if (referredBy) {
    // If it looks like a referral code, find the referrer and increment their count
    const referrer = await prisma.waitlistSubscriber.findUnique({
      where: { referralCode: referredBy },
    });
    if (referrer) {
      await prisma.waitlistSubscriber.update({
        where: { id: referrer.id },
        data: { referralCount: { increment: 1 } },
      });
      referredBy = referrer.email; // Store email for reference
    }
  }

  // Create new subscriber
  const subscriber = await prisma.waitlistSubscriber.create({
    data: {
      email: normalizedEmail,
      status: "PENDING",
      position,
      source: data.source,
      sourceIp: data.sourceIp,
      referrer: data.referrer,
      referredBy,
      referralCode,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent,
      workspaceId: data.workspaceId,
      metadata: data.metadata ?? undefined,
    },
  });

  return { subscriber, isNew: true, position };
}
