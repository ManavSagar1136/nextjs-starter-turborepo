"use client";

import { useEffect } from "react";
import { Button } from "@buildbase/ui/button";
import { Routes } from "@/data/routes";
import Link from "next/link";

export default function BlogsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Blogs error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-slate-400 dark:text-slate-600">{error.message || "An error occurred while loading blogs."}</p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline">
          <Link href={Routes.blogs}>Go to Blogs</Link>
        </Button>
      </div>
    </div>
  );
}
