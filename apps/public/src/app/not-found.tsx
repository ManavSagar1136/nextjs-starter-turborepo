import React from "react";

import { GoToHomeButton } from "@/components/ui/GoToHomeButton";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";

const NotFound = () => {
  return (
    <PageWithHeaderFooter>
      <section
        className="flex min-h-[60vh] flex-col items-center justify-center px-5 md:px-20 bg-white dark:bg-dark-surface"
      >
        <div className="space-y-4 text-center">
          <h1
            className="font-extrabold mk-gradient-text text-6xl md:text-7xl"
          >
            404
          </h1>
          <p
            className="mx-auto max-w-md leading-relaxed text-lg text-slate-600 dark:text-slate-400"
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
