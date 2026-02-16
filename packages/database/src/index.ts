import { env, isDevelopment } from "@buildbase/env";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment() ? ["query", "error", "warn"] : ["error"],
  });

if (isDevelopment()) globalForPrisma.prisma = prisma;

export * from "@prisma/client";

// Export user service functions
export * from "./user";

// Export email template service functions
export * from "./email-template";

// Export email provider service functions
export * from "./email-provider";

// Export sent email service functions
export * from "./sent-email";

// Export asset repository and filters
export * from "./assets";

// Export asset service functions
export * from "./asset";

// Export folder service functions
export * from "./folder";

// Export tag service functions
export * from "./tag";

// Export newsletter subscriber service functions
export * from "./newsletter-subscriber";

// Export contact submission service functions
export * from "./contact-submission";
