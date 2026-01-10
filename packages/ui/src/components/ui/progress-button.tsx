import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";

const progressButtonVariants = cva("relative overflow-hidden", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ProgressButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof progressButtonVariants> {
  loading?: boolean;
  success?: boolean;
  progress?: number;
  loadingText?: string;
  successText?: string;
  onComplete?: () => void;
}

export const ProgressButton = React.forwardRef<HTMLButtonElement, ProgressButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      success = false,
      progress = 0,
      loadingText = "Loading...",
      successText = "Success!",
      onComplete,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalProgress, setInternalProgress] = React.useState(0);
    const [internalLoading, setInternalLoading] = React.useState(false);
    const [internalSuccess, setInternalSuccess] = React.useState(false);

    const currentProgress = progress !== undefined ? progress : internalProgress;
    const currentLoading = loading !== undefined ? loading : internalLoading;
    const currentSuccess = success !== undefined ? success : internalSuccess;

    React.useEffect(() => {
      if (currentProgress >= 100 && currentLoading) {
        setInternalLoading(false);
        setInternalSuccess(true);
        onComplete?.();

        // Reset after 2 seconds
        setTimeout(() => {
          setInternalSuccess(false);
          setInternalProgress(0);
        }, 2000);
      }
    }, [currentProgress, currentLoading, onComplete]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (currentLoading || currentSuccess) return;

      setInternalLoading(true);
      setInternalProgress(0);

      // Simulate progress
      const interval = setInterval(() => {
        setInternalProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      props.onClick?.(e);
    };

    const getDisplayText = () => {
      if (currentSuccess) return successText;
      if (currentLoading) return loadingText;
      return children;
    };

    const getIcon = () => {
      if (currentSuccess) return <Check className="h-4 w-4" />;
      if (currentLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
      return null;
    };

    return (
      <Button
        ref={ref}
        className={cn(progressButtonVariants({ variant, size, className }))}
        disabled={disabled || currentLoading || currentSuccess}
        onClick={handleClick}
        {...props}
      >
        <div className="relative z-10 flex items-center gap-2">
          {getIcon()}
          {getDisplayText()}
        </div>

        {currentLoading && (
          <div
            className="bg-primary/20 absolute inset-0 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(currentProgress, 100)}%` }}
          />
        )}
      </Button>
    );
  }
);
ProgressButton.displayName = "ProgressButton";
