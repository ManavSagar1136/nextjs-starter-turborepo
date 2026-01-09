import * as React from "react";
import { Plus, Search, FileX, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  className?: string;
  variant?: "default" | "minimal" | "centered" | "compact";
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "default",
  size = "md",
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    if (icon) return icon;

    // Default icons based on common use cases
    if (title.toLowerCase().includes("search") || title.toLowerCase().includes("find")) {
      return <Search className="text-muted-foreground h-12 w-12" />;
    }
    if (title.toLowerCase().includes("file") || title.toLowerCase().includes("document")) {
      return <FileX className="text-muted-foreground h-12 w-12" />;
    }
    if (title.toLowerCase().includes("error") || title.toLowerCase().includes("problem")) {
      return <AlertCircle className="text-muted-foreground h-12 w-12" />;
    }
    return <Plus className="text-muted-foreground h-12 w-12" />;
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          icon: "h-8 w-8",
          title: "text-lg",
          description: "text-sm",
          spacing: "space-y-3",
        };
      case "md":
        return {
          icon: "h-12 w-12",
          title: "text-xl",
          description: "text-base",
          spacing: "space-y-4",
        };
      case "lg":
        return {
          icon: "h-16 w-16",
          title: "text-2xl",
          description: "text-lg",
          spacing: "space-y-6",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const content = (
    <div className={cn("flex flex-col items-center text-center", sizeClasses.spacing, className)}>
      {/* Icon */}
      <div className={cn("text-muted-foreground", sizeClasses.icon)}>{getDefaultIcon()}</div>

      {/* Title */}
      <h3 className={cn("text-foreground font-semibold", sizeClasses.title)}>{title}</h3>

      {/* Description */}
      {description && <p className={cn("text-muted-foreground max-w-md", sizeClasses.description)}>{description}</p>}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          {action && (
            <Button variant={action.variant || "default"} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant={secondaryAction.variant || "outline"} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === "minimal") {
    return <div className="py-8">{content}</div>;
  }

  if (variant === "centered") {
    return <div className="flex min-h-[400px] items-center justify-center">{content}</div>;
  }

  if (variant === "compact") {
    return (
      <div className="py-4">
        <div className="flex items-center gap-3">
          <div className={cn("text-muted-foreground", sizeClasses.icon)}>{getDefaultIcon()}</div>
          <div className="text-left">
            <h3 className={cn("font-semibold", sizeClasses.title)}>{title}</h3>
            {description && <p className={cn("text-muted-foreground", sizeClasses.description)}>{description}</p>}
          </div>
          {action && (
            <Button variant={action.variant || "default"} size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
}

// Pre-built empty states
export function EmptyStateSearch({ onSearch, className }: { onSearch?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={<Search className="text-muted-foreground h-12 w-12" />}
      title="No results found"
      description="Try adjusting your search criteria or filters to find what you're looking for."
      action={onSearch ? { label: "Clear filters", onClick: onSearch } : undefined}
      className={className}
    />
  );
}

export function EmptyStateCreate({ onCreate, className }: { onCreate?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={<Plus className="text-muted-foreground h-12 w-12" />}
      title="Nothing here yet"
      description="Get started by creating your first item."
      action={onCreate ? { label: "Create new", onClick: onCreate } : undefined}
      className={className}
    />
  );
}

export function EmptyStateError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={<AlertCircle className="text-muted-foreground h-12 w-12" />}
      title="Something went wrong"
      description="We encountered an error while loading your data. Please try again."
      action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
      className={className}
    />
  );
}

export function EmptyStateLoading({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={<RefreshCw className="text-muted-foreground h-12 w-12 animate-spin" />}
      title="Loading..."
      description="Please wait while we fetch your data."
      className={className}
    />
  );
}
