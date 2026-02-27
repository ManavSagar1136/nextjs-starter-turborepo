import React from "react";

import { GoToHomeButton } from "@/components/ui/GoToHomeButton";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";

const NotFound = () => {
  return (
    <PageWithHeaderFooter>
      <section
        className="flex min-h-[60vh] flex-col items-center justify-center px-[var(--mk-section-x)]"
        style={{ background: "var(--mk-bg-primary)" }}
      >
        <div className="space-y-4 text-center">
          <h1
            className="font-extrabold mk-gradient-text"
            style={{ fontSize: "var(--mk-text-hero)" }}
          >
            404
          </h1>
          <p
            className="mx-auto max-w-md leading-relaxed"
            style={{ fontSize: "var(--mk-text-lg)", color: "var(--mk-text-secondary)" }}
          >
            Oops! The page you&apos;re looking for doesn&apos;t exist. Please verify the URL or navigate back to the homepage.
          </p>
        </div>
        <div className="mt-8">
          <GoToHomeButton />
        </div>
      </section>
    </PageWithHeaderFooter>
  );
};

export default NotFound;
