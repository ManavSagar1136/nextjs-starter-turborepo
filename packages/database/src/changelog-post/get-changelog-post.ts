/**
 * @buildbase/database - Get Changelog Post
 */

import type { PrismaClient } from "@prisma/client";

export async function getChangelogPostById(prisma: PrismaClient, id: string) {
  return prisma.changelogPost.findUnique({ where: { id } });
}

export async function getChangelogPostBySlug(prisma: PrismaClient, slug: string) {
  return prisma.changelogPost.findUnique({ where: { slug } });
}
