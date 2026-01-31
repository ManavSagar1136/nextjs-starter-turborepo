/**
 * @buildbase/email - Constants
 */

/**
 * Encryption algorithm used for provider credentials
 */
export const ENCRYPTION_ALGORITHM = "aes-256-gcm";

/**
 * IV length for AES-GCM
 */
export const IV_LENGTH = 16;

/**
 * Auth tag length for AES-GCM
 */
export const AUTH_TAG_LENGTH = 16;

/**
 * Maximum email subject length (RFC 2822)
 */
export const MAX_SUBJECT_LENGTH = 998;

/**
 * Maximum HTML content size (10MB)
 */
export const MAX_HTML_SIZE = 10 * 1024 * 1024;

/**
 * Maximum attachment size (25MB)
 */
export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

/**
 * Default provider type when none is configured
 */
export const DEFAULT_PROVIDER_TYPE = "CONSOLE";

/**
 * Email regex pattern for validation
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
