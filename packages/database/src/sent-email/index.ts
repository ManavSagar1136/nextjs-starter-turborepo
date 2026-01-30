// Export repository functions
export {
  createSentEmail,
  getSentEmailById,
  getSentEmailByTrackingId,
  updateSentEmail,
  updateSentEmailByTrackingId,
  listSentEmails,
  deleteSentEmail,
  getSentEmailStats,
} from "./sent-email.repository";

// Export types
export type { EmailStatus, CreateSentEmailInput, UpdateSentEmailInput, SentEmailFilters } from "./types";
