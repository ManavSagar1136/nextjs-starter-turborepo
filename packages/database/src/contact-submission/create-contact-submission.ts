/**
 * @buildbase/database - Create Contact Submission
 */

import type { PrismaClient, ContactSubmission, Prisma } from "../generated/client";
import type { CreateContactSubmissionInput } from "./types";

/**
 * Create a new contact submission
 */
export async function createContactSubmission(
  prisma: PrismaClient,
  data: CreateContactSubmissionInput
): Promise<ContactSubmission> {
  const normalizedEmail = data.email.toLowerCase().trim();

  return prisma.contactSubmission.create({
    data: {
      email: normalizedEmail,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      company: data.company,
      subject: data.subject,
      message: data.message,
      category: data.category,
      priority: data.priority ?? "normal",
      status: "NEW",
      source: data.source,
      sourceIp: data.sourceIp,
      referrer: data.referrer,
      pageUrl: data.pageUrl,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      workspaceId: data.workspaceId,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}
