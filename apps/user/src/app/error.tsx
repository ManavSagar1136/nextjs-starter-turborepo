"use client";

import { useEffect } from "react";
import { Button } from "@buildbase/ui/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">An unexpected error occurred. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
