/**
 * @buildbase/database - Create Newsletter Subscriber
 */

import { randomBytes } from "crypto";
import type { PrismaClient, NewsletterSubscriber, Prisma } from "@prisma/client";
import type { CreateNewsletterSubscriberInput } from "./types";

/**
 * Generate a secure confirmation token
 */
function generateConfirmToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a new newsletter subscriber
 * @returns The created subscriber or existing subscriber if email already exists
 */
export async function createNewsletterSubscriber(
  prisma: PrismaClient,
  data: CreateNewsletterSubscriberInput
): Promise<{ subscriber: NewsletterSubscriber; isNew: boolean }> {
  const normalizedEmail = data.email.toLowerCase().trim();

  // Check if already exists
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    // If previously unsubscribed, resubscribe
    if (existing.status === "UNSUBSCRIBED") {
      const updated = await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          unsubscribedAt: null,
          subscribedAt: new Date(),
          source: data.source ?? existing.source,
          sourceIp: data.sourceIp ?? existing.sourceIp,
          // Update UTM if provided
          ...(data.utmSource && { utmSource: data.utmSource }),
          ...(data.utmMedium && { utmMedium: data.utmMedium }),
          ...(data.utmCampaign && { utmCampaign: data.utmCampaign }),
        },
      });
      return { subscriber: updated, isNew: false };
    }
    // Already subscribed
    return { subscriber: existing, isNew: false };
  }

  // Create new subscriber
  const confirmToken = data.requireConfirmation ? generateConfirmToken() : null;

  const subscriber = await prisma.newsletterSubscriber.create({
    data: {
      email: normalizedEmail,
      status: "ACTIVE",
      source: data.source,
      sourceIp: data.sourceIp,
      referrer: data.referrer,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent,
      workspaceId: data.workspaceId,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
      confirmToken,
      isConfirmed: !data.requireConfirmation,
      confirmedAt: data.requireConfirmation ? null : new Date(),
    },
  });

  return { subscriber, isNew: true };
}
