// Export all email provider service functions
export { createEmailProvider } from "./create-email-provider";
export { updateEmailProvider } from "./update-email-provider";
export { deleteEmailProvider } from "./delete-email-provider";
export { getEmailProviderById, getDefaultEmailProvider, getFirstActiveEmailProvider } from "./get-email-provider";
export { listEmailProviders, listActiveEmailProviders } from "./list-email-providers";
export { setDefaultEmailProvider } from "./set-default-provider";
export { incrementEmailsSent } from "./increment-emails-sent";

// Export types
export type { CreateEmailProviderInput, UpdateEmailProviderInput, ProviderType } from "./types";

// Export constants
export { PROVIDER_TYPES, PROVIDER_REQUIRED_FIELDS } from "./constants";
