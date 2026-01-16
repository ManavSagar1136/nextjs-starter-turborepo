"use client";

import { useRouter } from "next/navigation";
import { cva, VariantProps } from "class-variance-authority";
import { ArrowLeft, LogIn, Mail, ShieldAlert } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

const notAuthorizedVariants = cva("", {
  variants: {
    type: {
      icon: "",
      title: "",
      description: "",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  compoundVariants: [
    // Icon variants
    {
      type: "icon",
      size: "sm",
      class: "size-6",
    },
    {
      type: "icon",
      size: "md",
      class: "size-8",
    },
    {
      type: "icon",
      size: "lg",
      class: "size-10",
    },
    // Title variants
    {
      type: "title",
      size: "sm",
      class: "text-sm",
    },
    {
      type: "title",
      size: "md",
      class: "text-base",
    },
    {
      type: "title",
      size: "lg",
      class: "text-2xl sm:text-3xl",
    },
    // Description variants
    {
      type: "description",
      size: "sm",
      class: "text-sm",
    },
    {
      type: "description",
      size: "md",
      class: "text-base",
    },
    {
      type: "description",
      size: "lg",
      class: "text-sm sm:text-base",
    },
  ],
  defaultVariants: {
    size: "lg",
  },
});

type NotAuthorizedVariantProps = Pick<VariantProps<typeof notAuthorizedVariants>, "size">;

interface NotAuthorizedProps extends NotAuthorizedVariantProps {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  simple?: boolean;
  simpleMessage?: string;
  showActions?: boolean;
  onGoBack?: () => void;
  onRequestAccess?: () => void;
  onSignInDifferent?: () => void;
  goBackHref?: string;
  requestAccessHref?: string;
  signInDifferentHref?: string;
  goBackLabel?: string;
  requestAccessLabel?: string;
  signInDifferentLabel?: string;
}

export const NotAuthorized = ({
  title = "Not Authorized",
  description = "You do not have permission to view this content. Please contact your administrator if you believe this is an error.",
  icon,
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
  simple = false,
  simpleMessage,
  showActions = false,
  onGoBack,
  onRequestAccess,
  onSignInDifferent,
  goBackHref,
  requestAccessHref,
  signInDifferentHref,
  goBackLabel = "Go Back",
  requestAccessLabel = "Request Access",
  signInDifferentLabel = "Sign In with Different Account",
  size = "lg",
}: NotAuthorizedProps) => {
  const router = useRouter();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (goBackHref) {
      router.push(goBackHref);
    } else {
      router.back();
    }
  };

  const handleRequestAccess = () => {
    if (onRequestAccess) {
      onRequestAccess();
    } else if (requestAccessHref) {
      router.push(requestAccessHref);
    }
  };

  const handleSignInDifferent = () => {
    if (onSignInDifferent) {
      onSignInDifferent();
    } else if (signInDifferentHref) {
      router.push(signInDifferentHref);
    }
  };

  if (simple) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-amber-700 dark:text-amber-500", className)}>
        <ShieldAlert className="h-4 w-4" />
        <span>{simpleMessage || "Not authorized"}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[400px] flex-col items-center justify-center p-8 sm:p-12",
        "via-background dark:via-background flex-1 bg-gradient-to-br from-amber-50/30 to-orange-50/20 dark:from-amber-950/10 dark:to-orange-950/5",
        className
      )}
    >
      {/* Subtle background accent */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_50%_30%,rgba(251,191,36,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_30%,rgba(251,191,36,0.02),transparent_50%)]" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center space-y-6 text-center">
        {/* Icon */}
        <div
          className={cn(
            "rounded-full bg-amber-100 p-5 text-amber-600 shadow-sm dark:bg-amber-900/30 dark:text-amber-400",
            iconClassName
          )}
        >
          {icon || <ShieldAlert className={notAuthorizedVariants({ type: "icon", size })} />}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2
            className={cn(
              "text-foreground font-semibold",
              notAuthorizedVariants({ type: "title", size }),
              titleClassName
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              "text-muted-foreground max-w-md leading-relaxed",
              notAuthorizedVariants({ type: "description", size }),
              descriptionClassName
            )}
          >
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex w-full flex-col items-stretch justify-center gap-3 pt-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleGoBack}
              className="w-full min-w-[140px] sm:w-auto"
              aria-label={goBackLabel}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {goBackLabel}
            </Button>

            {(onRequestAccess || requestAccessHref) && (
              <Button
                variant="default"
                size="lg"
                onClick={handleRequestAccess}
                className="w-full min-w-[140px] sm:w-auto"
                aria-label={requestAccessLabel}
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {requestAccessLabel}
              </Button>
            )}

            {(onSignInDifferent || signInDifferentHref) && (
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSignInDifferent}
                className="w-full min-w-[140px] sm:w-auto"
                aria-label={signInDifferentLabel}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {signInDifferentLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
