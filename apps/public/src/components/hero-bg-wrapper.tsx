import React from "react";

import { cn } from "@buildbase/ui/lib/utils";

const HeroBgWrapper = ({
  children,
  classNames,
}: {
  children: React.ReactNode;
  classNames?: string;
}) => {
  return (
    <div
      className={cn(
        "h-auto rounded-xl flex flex-col justify-center items-center py-4 lg:py-6 px-4 lg:px-6 bg-slate-50 dark:bg-dark-surface-secondary text-slate-900 dark:text-slate-50",
        classNames,
      )}
    >
      {children}
    </div>
  );
};

export default HeroBgWrapper;
