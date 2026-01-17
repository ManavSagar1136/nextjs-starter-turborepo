import { AlertCircle, RefreshCw } from "lucide-react";

import { cn } from "@buildbase/ui/lib/utils";

import { Button } from "../ui/button";

const DocsError = ({
  error,
  refetch,
  isFetching,
  title = "Failed to load documentation",
  description = "An unexpected error occurred while loading the documentation.",
  className,
}: {
  error?: Error;
  refetch?: () => void;
  isFetching?: boolean;
  title?: string;
  description?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[75vh] gap-4 p-8",
        className,
      )}
    >
      <AlertCircle className="w-16 h-16 text-destructive" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-muted-foreground max-w-md">
          {error instanceof Error ? error.message : description}
        </p>
      </div>
      {refetch && (
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="mt-4"
          aria-label="Retry loading documentation"
          disabled={isFetching}
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")}
          />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default DocsError;
