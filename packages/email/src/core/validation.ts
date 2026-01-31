/**
 * @buildbase/email - Validation Utilities
 * Input validation for email operations
 */

import { ValidationError } from "./errors.js";

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Maximum sizes
 */
const MAX_SUBJECT_LENGTH = 998; // RFC 5322
const MAX_HTML_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_RECIPIENTS = 50;

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate and normalize email address
 * @throws ValidationError if invalid
 */
export function normalizeEmail(email: string, fieldName = "email"): string {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    throw new ValidationError("Email address is required", fieldName, email);
  }

  if (!validateEmail(trimmed)) {
    throw new ValidationError(`Invalid email address: ${email}`, fieldName, email);
  }

  return trimmed;
}

/**
 * Validate array of email addresses
 * @throws ValidationError if any are invalid
 */
export function validateEmails(emails: string | string[], fieldName = "to"): string[] {
  const isSingleString = !Array.isArray(emails);
  const emailArray = isSingleString ? [emails] : emails;

  if (emailArray.length === 0) {
    throw new ValidationError("At least one recipient is required", fieldName);
  }

  if (emailArray.length > MAX_RECIPIENTS) {
    throw new ValidationError(`Too many recipients (max ${MAX_RECIPIENTS})`, fieldName, emailArray.length);
  }

  // Use simple field name for single string input, indexed for arrays
  return emailArray.map((email, index) => normalizeEmail(email, isSingleString ? fieldName : `${fieldName}[${index}]`));
}

/**
 * Validate subject line
 * @throws ValidationError if invalid
 */
export function validateSubject(subject: string): string {
  const trimmed = subject.trim();

  if (!trimmed) {
    throw new ValidationError("Subject is required", "subject");
  }

  if (trimmed.length > MAX_SUBJECT_LENGTH) {
    throw new ValidationError(`Subject too long (max ${MAX_SUBJECT_LENGTH} characters)`, "subject", trimmed.length);
  }

  return trimmed;
}

/**
 * Validate HTML content
 * @throws ValidationError if invalid
 */
export function validateHtml(html: string): string {
  if (!html || !html.trim()) {
    throw new ValidationError("HTML content is required", "html");
  }

  const size = Buffer.byteLength(html, "utf8");
  if (size > MAX_HTML_SIZE) {
    throw new ValidationError(`HTML content too large (max ${MAX_HTML_SIZE / 1024 / 1024}MB)`, "html", size);
  }

  return html;
}

/**
 * Validate attachment
 * @throws ValidationError if invalid
 */
export function validateAttachment(attachment: {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}): void {
  if (!attachment.filename) {
    throw new ValidationError("Attachment filename is required", "attachment.filename");
  }

  const size =
    typeof attachment.content === "string"
      ? Buffer.byteLength(attachment.content, "base64")
      : attachment.content.length;

  if (size > MAX_ATTACHMENT_SIZE) {
    throw new ValidationError(
      `Attachment too large (max ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB)`,
      "attachment.content",
      size
    );
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

/**
 * Validate send email options (non-throwing)
 */
export function validateSendOptions(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: { email: string; name?: string };
  attachments?: Array<{ filename: string; content: string | Buffer }>;
}): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Validate recipients
  try {
    validateEmails(options.to);
  } catch (e) {
    if (e instanceof ValidationError) {
      errors.push({ field: e.field, message: e.message });
    }
  }

  // Validate subject
  try {
    validateSubject(options.subject);
  } catch (e) {
    if (e instanceof ValidationError) {
      errors.push({ field: e.field, message: e.message });
    }
  }

  // Validate HTML
  try {
    validateHtml(options.html);
  } catch (e) {
    if (e instanceof ValidationError) {
      errors.push({ field: e.field, message: e.message });
    }
  }

  // Validate from email if provided
  if (options.from?.email) {
    try {
      normalizeEmail(options.from.email, "from.email");
    } catch (e) {
      if (e instanceof ValidationError) {
        errors.push({ field: e.field, message: e.message });
      }
    }
  }

  // Validate attachments
  if (options.attachments) {
    for (let i = 0; i < options.attachments.length; i++) {
      const attachment = options.attachments[i];
      if (!attachment) continue;
      try {
        validateAttachment(attachment);
      } catch (e) {
        if (e instanceof ValidationError) {
          errors.push({ field: `attachments[${i}]`, message: e.message });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
