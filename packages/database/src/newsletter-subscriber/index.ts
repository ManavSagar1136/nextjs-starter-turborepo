/**
 * @buildbase/database - Newsletter Subscriber Repository
 */

// Types
export * from "./types";

// Create
export { createNewsletterSubscriber } from "./create-newsletter-subscriber";

// Read
export {
  getNewsletterSubscriberById,
  getNewsletterSubscriberByEmail,
  getNewsletterSubscriberByToken,
  isEmailSubscribedToNewsletter,
} from "./get-newsletter-subscriber";

// List
export {
  listNewsletterSubscribers,
  getNewsletterSubscriberStats,
  getActiveNewsletterEmails,
} from "./list-newsletter-subscribers";

// Update
export {
  updateNewsletterSubscriber,
  confirmNewsletterSubscriber,
  unsubscribeNewsletterByEmail,
  unsubscribeNewsletterById,
  markNewsletterSubscriberBounced,
  markNewsletterSubscriberComplained,
  deleteNewsletterSubscriber,
} from "./update-newsletter-subscriber";
