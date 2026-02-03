/**
 * @buildbase/database - Update Newsletter Subscriber
 */

import type { PrismaClient, NewsletterSubscriber } from "../generated/client";
import type { UpdateNewsletterSubscriberInput } from "./types";

/**
 * Update a newsletter subscriber by ID
 */
export async function updateNewsletterSubscriber(
  prisma: PrismaClient,
  id: string,
  data: UpdateNewsletterSubscriberInput
): Promise<NewsletterSubscriber> {
  return prisma.newsletterSubscriber.update({
    where: { id },
    data: {
      ...data,
      metadata: data.metadata ?? undefined,
    },
  });
}

/**
 * Confirm a newsletter subscriber (double opt-in)
 */
export async function confirmNewsletterSubscriber(
  prisma: PrismaClient,
  token: string
): Promise<NewsletterSubscriber | null> {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { confirmToken: token },
  });

  if (!subscriber) {
    return null;
  }

  if (subscriber.isConfirmed) {
    return subscriber; // Already confirmed
  }

  return prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      isConfirmed: true,
      confirmedAt: new Date(),
      confirmToken: null, // Clear token after use
    },
  });
}

/**
 * Unsubscribe a newsletter subscriber by email
 */
export async function unsubscribeNewsletterByEmail(
  prisma: PrismaClient,
  email: string
): Promise<NewsletterSubscriber | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (!subscriber) {
    return null;
  }

  if (subscriber.status === "UNSUBSCRIBED") {
    return subscriber; // Already unsubscribed
  }

  return prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    },
  });
}

/**
 * Unsubscribe a newsletter subscriber by ID
 */
export async function unsubscribeNewsletterById(
  prisma: PrismaClient,
  id: string
): Promise<NewsletterSubscriber> {
  return prisma.newsletterSubscriber.update({
    where: { id },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    },
  });
}

/**
 * Mark subscriber as bounced
 */
export async function markNewsletterSubscriberBounced(
  prisma: PrismaClient,
  email: string
): Promise<NewsletterSubscriber | null> {
  const normalizedEmail = email.toLowerCase().trim();

  return prisma.newsletterSubscriber.update({
    where: { email: normalizedEmail },
    data: {
      status: "BOUNCED",
    },
  });
}

/**
 * Mark subscriber as complained (spam report)
 */
export async function markNewsletterSubscriberComplained(
  prisma: PrismaClient,
  email: string
): Promise<NewsletterSubscriber | null> {
  const normalizedEmail = email.toLowerCase().trim();

  return prisma.newsletterSubscriber.update({
    where: { email: normalizedEmail },
    data: {
      status: "COMPLAINED",
    },
  });
}

/**
 * Delete a newsletter subscriber (hard delete)
 */
export async function deleteNewsletterSubscriber(
  prisma: PrismaClient,
  id: string
): Promise<void> {
  await prisma.newsletterSubscriber.delete({
    where: { id },
  });
}
