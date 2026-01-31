// Export all email template service functions
export { createEmailTemplate } from "./create-email-template";
export { updateEmailTemplate } from "./update-email-template";
export { deleteEmailTemplate } from "./delete-email-template";
export { getEmailTemplateById, getEmailTemplateBySlug } from "./get-email-template";
export { listEmailTemplates, listEmailTemplatesByCategory } from "./list-email-templates";
export { duplicateEmailTemplate } from "./duplicate-email-template";

// Export types (EmailTemplateCategory comes from Prisma via ./generated/client)
export type {
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
  TemplateVariable,
  ListEmailTemplatesOptions,
  PaginatedEmailTemplates,
} from "./types";

// Export enum and constants
export { EmailTemplateType, EMAIL_TEMPLATE_TYPES } from "./types";

// Export constants
export { EMAIL_TEMPLATE_CATEGORIES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./constants";
