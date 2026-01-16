"use client";

import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { Button } from "@buildbase/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@buildbase/ui/alert";
import { AlertTriangle } from "lucide-react";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const RootError = ({ error, reset }: RootErrorProps) => {
  return (
    <PageWithHeaderFooter>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong!</AlertTitle>
          <AlertDescription>
            {error.message || "An unexpected error occurred. Please try again."}
            {error.digest && (
              <div className="mt-2 text-xs">
                Error ID: {error.digest}
              </div>
            )}
          </AlertDescription>
        </Alert>
        <Button onClick={reset}>Try again</Button>
      </div>
    </PageWithHeaderFooter>
  );
};

export default RootError;
