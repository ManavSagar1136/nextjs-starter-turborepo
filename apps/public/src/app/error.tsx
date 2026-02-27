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
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-[var(--mk-section-x)]"
        style={{ background: "var(--mk-bg-primary)" }}
      >
        <div
          className="mx-auto max-w-lg rounded-[var(--mk-radius-lg)] border p-6 space-y-4"
          style={{
            borderColor: "var(--mk-border)",
            background: "var(--mk-bg-secondary)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-[var(--mk-radius-sm)]"
              style={{ background: "rgba(239, 68, 68, 0.1)" }}
            >
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--mk-text-primary)" }}
            >
              Something went wrong!
            </h2>
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--mk-text-secondary)" }}
          >
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p className="text-xs" style={{ color: "var(--mk-text-muted)" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-[var(--mk-radius-sm)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
          style={{ background: "var(--mk-brand)", boxShadow: "var(--mk-shadow-brand)" }}
        >
          Try again
        </button>
      </div>
    </PageWithHeaderFooter>
  );
};

export default RootError;
