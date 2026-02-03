/**
 * @buildbase/database - Contact Submission Repository
 */

// Types
export * from "./types";

// Create
export { createContactSubmission } from "./create-contact-submission";

// Read
export {
  getContactSubmissionById,
  getContactSubmissionsByEmail,
  getUnreadContactSubmissionsCount,
} from "./get-contact-submission";

// List
export {
  listContactSubmissions,
  getContactSubmissionStats,
  getContactSubmissionCategories,
} from "./list-contact-submissions";

// Update
export {
  updateContactSubmission,
  markContactSubmissionRead,
  markContactSubmissionReplied,
  archiveContactSubmission,
  markContactSubmissionSpam,
  assignContactSubmission,
  unassignContactSubmission,
  archiveOldContactSubmissions,
  deleteContactSubmission,
  deleteSpamContactSubmissions,
} from "./update-contact-submission";
