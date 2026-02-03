/**
 * @buildbase/database - Get Waitlist Subscriber
 */

import type { PrismaClient, WaitlistSubscriber } from "../generated/client";

/**
 * Get a waitlist subscriber by ID
 */
export async function getWaitlistSubscriberById(
  prisma: PrismaClient,
  id: string
): Promise<WaitlistSubscriber | null> {
  return prisma.waitlistSubscriber.findUnique({
    where: { id },
  });
}

/**
 * Get a waitlist subscriber by email
 */
export async function getWaitlistSubscriberByEmail(
  prisma: PrismaClient,
  email: string
): Promise<WaitlistSubscriber | null> {
  return prisma.waitlistSubscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
}

/**
 * Get a waitlist subscriber by referral code
 */
export async function getWaitlistSubscriberByReferralCode(
  prisma: PrismaClient,
  code: string
): Promise<WaitlistSubscriber | null> {
  return prisma.waitlistSubscriber.findUnique({
    where: { referralCode: code.toUpperCase() },
  });
}

/**
 * Get a waitlist subscriber by invite token
 */
export async function getWaitlistSubscriberByInviteToken(
  prisma: PrismaClient,
  token: string
): Promise<WaitlistSubscriber | null> {
  return prisma.waitlistSubscriber.findUnique({
    where: { inviteToken: token },
  });
}

/**
 * Check if an email is on the waitlist (pending or invited)
 */
export async function isEmailOnWaitlist(
  prisma: PrismaClient,
  email: string
): Promise<boolean> {
  const subscriber = await prisma.waitlistSubscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { status: true },
  });

  return subscriber?.status === "PENDING" || subscriber?.status === "INVITED";
}

/**
 * Get waitlist position for an email
 */
export async function getWaitlistPosition(
  prisma: PrismaClient,
  email: string
): Promise<number | null> {
  const subscriber = await prisma.waitlistSubscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { position: true, status: true },
  });

  if (!subscriber || subscriber.status !== "PENDING") {
    return null;
  }

  return subscriber.position;
}
