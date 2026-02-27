"use client";

import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { AlertTriangle } from "lucide-react";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const RootError = ({ error, reset }: RootErrorProps) => {
  return (
    <PageWithHeaderFooter>
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-5 md:px-20 bg-white dark:bg-dark-surface"
      >
        <div
          className="mx-auto max-w-lg rounded-2xl border p-6 space-y-4 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-surface-secondary"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10"
            >
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h2
              className="text-lg font-semibold text-slate-900 dark:text-slate-50"
            >
              Something went wrong!
            </h2>
          </div>
          <p
            className="text-sm leading-relaxed text-slate-600 dark:text-slate-400"
          >
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 dark:text-slate-600">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 bg-indigo-500"
          style={{ boxShadow: "0 0 32px rgba(99, 102, 241, 0.15)" }}
        >
          Try again
        </button>
      </div>
    </PageWithHeaderFooter>
  );
};

export default RootError;
