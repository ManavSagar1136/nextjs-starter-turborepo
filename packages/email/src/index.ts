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

// Factory exports
export { EmailFactory } from "./factory/email.factory.js";

// Service exports
export { EmailService, sendEmail } from "./service/email.service.js";
export { ProviderService } from "./service/provider.service.js";
