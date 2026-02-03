/**
 * @buildbase/database - Get Newsletter Subscriber
 */

import type { PrismaClient, NewsletterSubscriber } from "../generated/client";

/**
 * Get a newsletter subscriber by ID
 */
export async function getNewsletterSubscriberById(
  prisma: PrismaClient,
  id: string
): Promise<NewsletterSubscriber | null> {
  return prisma.newsletterSubscriber.findUnique({
    where: { id },
  });
}

/**
 * Get a newsletter subscriber by email
 */
export async function getNewsletterSubscriberByEmail(
  prisma: PrismaClient,
  email: string
): Promise<NewsletterSubscriber | null> {
  return prisma.newsletterSubscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

/**
 * Get a newsletter subscriber by confirmation token
 */
export async function getNewsletterSubscriberByToken(
  prisma: PrismaClient,
  token: string
): Promise<NewsletterSubscriber | null> {
  return prisma.newsletterSubscriber.findUnique({
    where: { confirmToken: token },
  });
}

/**
 * Check if an email is subscribed (active)
 */
export async function isEmailSubscribedToNewsletter(
  prisma: PrismaClient,
  email: string
): Promise<boolean> {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { status: true, isConfirmed: true },
  });

  return subscriber?.status === "ACTIVE" && subscriber?.isConfirmed === true;
}
