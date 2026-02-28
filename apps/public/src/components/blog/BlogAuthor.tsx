import type { IBlogAuthor } from "@/services/blogs";

import { Avatar, AvatarFallback, AvatarImage } from "@buildbase/ui/components/ui/avatar";

import { cn } from "@buildbase/ui/lib/utils";

interface BlogAuthorProps {
  authors: IBlogAuthor[] | undefined | null;
  /**
   * Variant style for the author display
   * - "compact": Small avatar with name only (for cards)
   * - "full": Avatar with "Written by" label and all authors
   * - "minimal": Just the author names without avatar
   */
  variant?: "compact" | "full" | "minimal";
  /**
   * Avatar size
   */
  avatarSize?: "sm" | "md" | "lg";
  /**
   * Show "Written by" label (only applies to "full" variant)
   */
  showLabel?: boolean;
  /**
   * Show "by" prefix (only applies to "full" variant when showLabel is false)
   */
  showByPrefix?: boolean;
  /**
   * Maximum number of authors to display before truncating
   */
  maxAuthors?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Alignment
   */
  align?: "left" | "center" | "right";
}

const avatarSizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

const avatarTextSizeClasses = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm font-semibold",
};

export function BlogAuthor({
  authors,
  variant = "full",
  avatarSize = "md",
  showLabel = true,
  showByPrefix = false,
  maxAuthors,
  className,
  align = "left",
}: BlogAuthorProps) {
  if (!authors || authors.length === 0) {
    return null;
  }

  // Get author display name
  const getAuthorName = (author: IBlogAuthor) => {
    return author.name || author.username || "Unknown";
  };

  // Get author initial for avatar
  const getAuthorInitial = (author: IBlogAuthor) => {
    const name = getAuthorName(author);
    return name.charAt(0).toUpperCase();
  };

  // Get avatar URL
  const getAvatarUrl = (author: IBlogAuthor) => {
    const identifier = author.username || author.name;
    return identifier ? `/api/avatar/${identifier}` : undefined;
  };

  // Limit authors if maxAuthors is specified
  const displayAuthors = maxAuthors ? authors.slice(0, maxAuthors) : authors;
  const remainingCount = maxAuthors ? authors.length - maxAuthors : 0;

  // Get all author names as string
  const authorNames = displayAuthors.map((a) => getAuthorName(a)).join(", ");
  const fullAuthorText =
    remainingCount > 0
      ? `${authorNames} and ${remainingCount} more`
      : authorNames;

  // Compact variant (small avatar + name, no label)
  if (variant === "compact") {
    const firstAuthor = authors[0]!;
    return (
      <div className={cn("flex items-center gap-1.5 min-w-0", className)}>
        <Avatar className={cn("flex-shrink-0", avatarSizeClasses[avatarSize])}>
          <AvatarImage src={getAvatarUrl(firstAuthor)} />
          <AvatarFallback className={avatarTextSizeClasses[avatarSize]}>
            {getAuthorInitial(firstAuthor)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate max-w-[100px] @sm:max-w-[120px] text-xs">
          {getAuthorName(firstAuthor)}
        </span>
      </div>
    );
  }

  // Minimal variant (just names, no avatar)
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "text-sm text-slate-400 dark:text-slate-600",
          align === "center" && "text-center",
          align === "right" && "text-right",
          className,
        )}
      >
        {fullAuthorText}
      </div>
    );
  }

  // Full variant (each author in their own block with image, name, and username)
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center",
        align === "right" && "items-end",
        className,
      )}
    >
      {showLabel && (
        <p className="font-medium text-sm text-slate-900 dark:text-slate-50">
          Written by
        </p>
      )}
      <div className={cn("flex flex-wrap gap-4", alignmentClasses[align])}>
        {displayAuthors.map((author, index) => (
          <div
            key={author.id || index}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-100/30 dark:bg-dark-surface-elevated/30 hover:bg-slate-100/50 dark:hover:bg-dark-surface-elevated/50 transition-colors"
          >
            <Avatar className={avatarSizeClasses[avatarSize]}>
              <AvatarImage src={author.image || getAvatarUrl(author)} />
              <AvatarFallback
                className={cn(
                  avatarTextSizeClasses[avatarSize],
                  "bg-brand-500 text-white",
                )}
              >
                {getAuthorInitial(author)}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "flex flex-col",
                align === "center" && "items-center text-center",
                align === "right" && "items-end text-right",
              )}
            >
              <p className="font-medium text-sm text-slate-900 dark:text-slate-50">
                {getAuthorName(author)}
              </p>
              {author.username && (
                <p className="text-xs text-slate-400 dark:text-slate-600">
                  @{author.username}
                </p>
              )}
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex items-center justify-center p-3">
            <p className="text-sm text-slate-400 dark:text-slate-600">
              and {remainingCount} more
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
