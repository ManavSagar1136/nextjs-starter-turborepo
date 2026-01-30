/**
 * @buildbase/database - Email Provider Constants
 */

export const PROVIDER_TYPES = ["CONSOLE", "SMTP", "RESEND", "MAILGUN", "SENDGRID", "SES"] as const;

export const PROVIDER_REQUIRED_FIELDS: Record<string, string[]> = {
  CONSOLE: [],
  SMTP: ["host", "port", "username", "password"],
  RESEND: ["apiKey"],
  MAILGUN: ["apiKey", "domain"],
  SENDGRID: ["apiKey"],
  SES: ["region", "accessKeyId", "secretAccessKey"],
};
