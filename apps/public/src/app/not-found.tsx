import React from "react";

import { GoToHomeButton } from "@/components/ui/GoToHomeButton";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import { PageError } from "@buildbase/components/common/PageError";

const NotFound = () => {
  return (
    <PageWithHeaderFooter>
      <section className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
        <div className="space-y-4 text-center">
          <h1 className="text-6xl font-bold">404</h1>
          <PageError subTitle="Oops! The page you're looking for doesn't exist. Please verify the URL or navigate back to the homepage." />
        </div>
        <GoToHomeButton />
      </section>
    </PageWithHeaderFooter>
  );
};

export default NotFound;
