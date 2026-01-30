export {
  EmailProviderApis,
  type EmailProvider,
  type CreateEmailProviderInput,
  type UpdateEmailProviderInput,
  type TestProviderResponse,
} from "./email-provider.service";
export {
  EmailTemplateApis,
  type EmailTemplate,
  type CreateEmailTemplateInput,
  type UpdateEmailTemplateInput,
  type PaginatedEmailTemplates,
} from "./email-template.service";
export {
  EmailSentApis,
  type SentEmail,
  type ListSentEmailsOptions,
  type PaginatedSentEmails,
} from "./email-sent.service";
export { EmailStatsApis, type EmailStats, type EmailStatsOptions } from "./email-stats.service";
