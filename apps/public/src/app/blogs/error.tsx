"use client";

import { useEffect } from "react";
import { Button } from "@buildbase/ui/button";
import { Routes } from "@/data/routes";

export default function BlogsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Blogs error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">
        {error.message || "An error occurred while loading blogs."}
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href={Routes.blogs}>Go to Blogs</a>
        </Button>
      </div>
    </div>
  );
}
