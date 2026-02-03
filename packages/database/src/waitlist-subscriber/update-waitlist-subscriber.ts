/**
 * @buildbase/database - Update Waitlist Subscriber
 */

import { randomBytes } from "crypto";
import type { PrismaClient, WaitlistSubscriber } from "../generated/client";
import type { UpdateWaitlistSubscriberInput } from "./types";

/**
 * Generate a secure invite token
 */
function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Update a waitlist subscriber by ID
 */
export async function updateWaitlistSubscriber(
  prisma: PrismaClient,
  id: string,
  data: UpdateWaitlistSubscriberInput
): Promise<WaitlistSubscriber> {
  return prisma.waitlistSubscriber.update({
    where: { id },
    data: {
      ...data,
      metadata: data.metadata ?? undefined,
    },
  });
}

/**
 * Invite a waitlist subscriber (send them an invite)
 */
export async function inviteWaitlistSubscriber(
  prisma: PrismaClient,
  id: string,
  expiresInDays: number = 7
): Promise<WaitlistSubscriber> {
  const inviteToken = generateInviteToken();
  const inviteExpires = new Date();
  inviteExpires.setDate(inviteExpires.getDate() + expiresInDays);

  return prisma.waitlistSubscriber.update({
    where: { id },
    data: {
      status: "INVITED",
      invitedAt: new Date(),
      inviteToken,
      inviteExpires,
    },
  });
}

/**
 * Mark a waitlist subscriber as converted (signed up)
 */
export async function convertWaitlistSubscriber(
  prisma: PrismaClient,
  id: string
): Promise<WaitlistSubscriber> {
  return prisma.waitlistSubscriber.update({
    where: { id },
    data: {
      status: "CONVERTED",
      convertedAt: new Date(),
      inviteToken: null, // Clear token
    },
  });
}

/**
 * Convert by invite token (when user signs up via invite link)
 */
export async function convertWaitlistByToken(
  prisma: PrismaClient,
  token: string
): Promise<WaitlistSubscriber | null> {
  const subscriber = await prisma.waitlistSubscriber.findUnique({
    where: { inviteToken: token },
  });

  if (!subscriber) {
    return null;
  }

  // Check if expired
  if (subscriber.inviteExpires && subscriber.inviteExpires < new Date()) {
    await prisma.waitlistSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }

  return prisma.waitlistSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "CONVERTED",
      convertedAt: new Date(),
      inviteToken: null,
    },
  });
}

/**
 * Unsubscribe from waitlist by email
 */
export async function unsubscribeWaitlistByEmail(
  prisma: PrismaClient,
  email: string
): Promise<WaitlistSubscriber | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const subscriber = await prisma.waitlistSubscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (!subscriber) {
    return null;
  }

  if (subscriber.status === "UNSUBSCRIBED") {
    return subscriber;
  }

  return prisma.waitlistSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    },
  });
}

/**
 * Unsubscribe from waitlist by ID
 */
export async function unsubscribeWaitlistById(
  prisma: PrismaClient,
  id: string
): Promise<WaitlistSubscriber> {
  return prisma.waitlistSubscriber.update({
    where: { id },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    },
  });
}

/**
 * Expire old invitations
 */
export async function expireOldWaitlistInvitations(
  prisma: PrismaClient
): Promise<number> {
  const result = await prisma.waitlistSubscriber.updateMany({
    where: {
      status: "INVITED",
      inviteExpires: { lt: new Date() },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return result.count;
}

/**
 * Delete a waitlist subscriber (hard delete)
 */
export async function deleteWaitlistSubscriber(
  prisma: PrismaClient,
  id: string
): Promise<void> {
  await prisma.waitlistSubscriber.delete({
    where: { id },
  });
}
