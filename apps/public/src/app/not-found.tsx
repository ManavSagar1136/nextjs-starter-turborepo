import React from "react";

import { GoToHomeButton } from "@/components/ui/GoToHomeButton";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import PageError from "@/components/ui/PageError";

const NotFound = () => {
  return (
    <PageWithHeaderFooter>
      <section className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold">404</h1>
          <PageError subTitle="Oops! The page you're looking for doesn't exist. Please verify the URL or navigate back to the homepage." />
        </div>
        <GoToHomeButton />
      </section>
    </PageWithHeaderFooter>
  );
};

export default NotFound;
