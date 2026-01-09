import * as React from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean;
  text?: string;
  spinner?: boolean;
  backdrop?: boolean;
  children: React.ReactNode;
}

export function LoadingOverlay({
  loading = true,
  text,
  spinner = true,
  backdrop = true,
  className,
  children,
  ...props
}: LoadingOverlayProps) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          backdrop && "bg-background/80 backdrop-blur-sm"
        )}
      >
        <div className="flex flex-col items-center gap-2">
          {spinner && <LoadingSpinner />}
          {text && <p className="text-muted-foreground text-sm">{text}</p>}
        </div>
      </div>
    </div>
  );
}
