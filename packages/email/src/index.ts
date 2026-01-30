/**
 * @buildbase/email
 * Enterprise email package with multi-provider support
 *
 * @example
 * ```typescript
 * import { EmailService, sendEmail } from '@buildbase/email';
 *
 * // Initialize with Prisma
 * EmailService.initialize(prisma);
 *
 * // Send an email
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Hello!',
 *   html: '<h1>Welcome</h1>',
 * });
 * ```
 */

// Core exports
export * from "./core/types.js";
export * from "./core/errors.js";
export * from "./core/constants.js";
export { encrypt, decrypt, encryptConfig, decryptConfig, generateEncryptionKey } from "./core/encryption.js";

// Provider exports
export { BaseProvider, type DbEmailProvider } from "./providers/base.provider.js";
export { ConsoleProvider, createConsoleProvider } from "./providers/console.provider.js";
export { NodemailerProvider } from "./providers/nodemailer.provider.js";
export { ResendProvider } from "./providers/resend.provider.js";
export { MailgunProvider } from "./providers/mailgun.provider.js";
export { SendGridProvider } from "./providers/sendgrid.provider.js";
export { SesProvider } from "./providers/ses.provider.js";

// Factory exports
export { EmailFactory } from "./factory/email.factory.js";

// Service exports
export { EmailService, sendEmail } from "./service/email.service.js";
export { ProviderService } from "./service/provider.service.js";

// Template exports
export * from "./templates/types.js";
export {
  renderTemplate,
  extractVariables,
  validateVariables,
  applyDefaults,
  htmlToText,
  generateSlug,
} from "./templates/renderer.js";
export { TemplateService, TemplateNotFoundError, MissingVariablesError } from "./templates/template.service.js";

// Queue exports
export * from "./queue/types.js";
export { EmailQueue, EmailQueueService, getEmailQueue } from "./queue/queue.service.js";
export { verifyQStashSignature, createQStashMiddleware, processQueuedEmail } from "./queue/verify.js";
export { QueueNotConfiguredError, QueueOperationError } from "./queue/errors.js";
