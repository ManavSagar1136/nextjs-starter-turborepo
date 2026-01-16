import { Alert, AlertDescription, AlertTitle } from "@buildbase/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ErrorScreenProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

export const ErrorScreen = ({ error, reset }: ErrorScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
      <Alert variant="destructive" className="max-w-2xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription>
          {error.message || "An unexpected error occurred. Please try again."}
          {error.digest && (
            <div className="mt-2 text-xs">Error ID: {error.digest}</div>
          )}
        </AlertDescription>
      </Alert>
      {reset && (
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      )}
    </div>
  );
};
