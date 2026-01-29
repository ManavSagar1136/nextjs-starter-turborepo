/**
 * Media Library Utility Functions
 */

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Get file type configuration for icons and colors
 */
export interface FileTypeConfig {
  icon: string;
  color: string;
  label: string;
}

const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
  // Images
  "image/jpeg": { icon: "image", color: "#10B981", label: "JPEG" },
  "image/jpg": { icon: "image", color: "#10B981", label: "JPG" },
  "image/png": { icon: "image", color: "#10B981", label: "PNG" },
  "image/gif": { icon: "image", color: "#10B981", label: "GIF" },
  "image/webp": { icon: "image", color: "#10B981", label: "WEBP" },
  "image/svg+xml": { icon: "image", color: "#10B981", label: "SVG" },
  "image/bmp": { icon: "image", color: "#10B981", label: "BMP" },
  "image/tiff": { icon: "image", color: "#10B981", label: "TIFF" },

  // Videos
  "video/mp4": { icon: "video", color: "#8B5CF6", label: "MP4" },
  "video/webm": { icon: "video", color: "#8B5CF6", label: "WEBM" },
  "video/ogg": { icon: "video", color: "#8B5CF6", label: "OGG" },
  "video/quicktime": { icon: "video", color: "#8B5CF6", label: "MOV" },
  "video/x-msvideo": { icon: "video", color: "#8B5CF6", label: "AVI" },

  // Audio
  "audio/mpeg": { icon: "audio", color: "#F59E0B", label: "MP3" },
  "audio/wav": { icon: "audio", color: "#F59E0B", label: "WAV" },
  "audio/ogg": { icon: "audio", color: "#F59E0B", label: "OGG" },
  "audio/webm": { icon: "audio", color: "#F59E0B", label: "WEBM" },
  "audio/aac": { icon: "audio", color: "#F59E0B", label: "AAC" },

  // Documents
  "application/pdf": { icon: "file-text", color: "#EF4444", label: "PDF" },
  "application/msword": { icon: "file-text", color: "#3B82F6", label: "DOC" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: "file-text",
    color: "#3B82F6",
    label: "DOCX",
  },
  "application/vnd.ms-excel": { icon: "file-spreadsheet", color: "#22C55E", label: "XLS" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: "file-spreadsheet",
    color: "#22C55E",
    label: "XLSX",
  },
  "application/vnd.ms-powerpoint": { icon: "file-presentation", color: "#F97316", label: "PPT" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    icon: "file-presentation",
    color: "#F97316",
    label: "PPTX",
  },

  // Archives
  "application/zip": { icon: "archive", color: "#6B7280", label: "ZIP" },
  "application/x-rar-compressed": { icon: "archive", color: "#6B7280", label: "RAR" },
  "application/x-7z-compressed": { icon: "archive", color: "#6B7280", label: "7Z" },
  "application/gzip": { icon: "archive", color: "#6B7280", label: "GZIP" },

  // Code
  "application/json": { icon: "file-code", color: "#A855F7", label: "JSON" },
  "application/xml": { icon: "file-code", color: "#A855F7", label: "XML" },
  "text/html": { icon: "file-code", color: "#A855F7", label: "HTML" },
  "text/css": { icon: "file-code", color: "#A855F7", label: "CSS" },
  "text/javascript": { icon: "file-code", color: "#A855F7", label: "JS" },
  "application/javascript": { icon: "file-code", color: "#A855F7", label: "JS" },

  // Text
  "text/plain": { icon: "file-text", color: "#6B7280", label: "TXT" },
  "text/csv": { icon: "file-spreadsheet", color: "#22C55E", label: "CSV" },
  "text/markdown": { icon: "file-text", color: "#6B7280", label: "MD" },
};

const DEFAULT_FILE_CONFIG: FileTypeConfig = {
  icon: "file",
  color: "#6B7280",
  label: "FILE",
};

export function getFileTypeConfig(contentType: string): FileTypeConfig {
  // Exact match
  if (FILE_TYPE_CONFIGS[contentType]) {
    return FILE_TYPE_CONFIGS[contentType];
  }

  // Category match (e.g., image/*, video/*)
  const category = contentType.split("/")[0] || "";
  const categoryMatch = Object.entries(FILE_TYPE_CONFIGS).find(([key]) => key.startsWith(`${category}/`));

  if (categoryMatch) {
    return {
      ...categoryMatch[1],
      label: contentType.split("/")[1]?.toUpperCase() || category.toUpperCase(),
    };
  }

  return {
    ...DEFAULT_FILE_CONFIG,
    label: contentType.split("/")[1]?.toUpperCase() || "FILE",
  };
}

/**
 * Check if content type is an image
 */
export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/**
 * Check if content type is a video
 */
export function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith("video/");
}

/**
 * Check if content type is audio
 */
export function isAudioContentType(contentType: string): boolean {
  return contentType.startsWith("audio/");
}

/**
 * Get preview URL for an asset (might use transformations for images)
 */
export function getAssetPreviewUrl(url: string, contentType: string): string {
  // For now, just return the original URL
  // In the future, this could add image transformations
  return url;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

/**
 * Common MIME type filters for the media library
 */
export const MIME_TYPE_FILTERS = [
  { label: "Images", value: "image/*", pattern: "image/" },
  { label: "Videos", value: "video/*", pattern: "video/" },
  { label: "Audio", value: "audio/*", pattern: "audio/" },
  { label: "Documents", value: "application/pdf", pattern: "application/pdf" },
  { label: "Spreadsheets", value: "spreadsheet", pattern: "spreadsheet" },
];

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Get file extension from filename or content type
 */
export function getFileExtension(filename?: string, contentType?: string): string {
  if (filename) {
    const parts = filename.split(".");
    if (parts.length > 1) {
      const ext = parts.pop();
      return ext ? ext.toUpperCase() : "";
    }
  }

  if (contentType) {
    const type = contentType.split("/")[1];
    if (type) {
      // Handle special cases like "svg+xml"
      const ext = type.split("+")[0];
      return ext ? ext.toUpperCase() : "";
    }
  }

  return "";
}

/**
 * Generate a unique key for React lists
 */
export function generateKey(prefix: string, id: string | number): string {
  return `${prefix}-${id}`;
}
