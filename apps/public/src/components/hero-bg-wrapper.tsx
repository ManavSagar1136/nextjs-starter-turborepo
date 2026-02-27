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
        "h-auto rounded-[var(--mk-radius-md)] flex flex-col justify-center items-center py-4 lg:py-6 px-4 lg:px-6",
        classNames,
      )}
      style={{
        background: "var(--mk-bg-secondary)",
        color: "var(--mk-text-primary)",
      }}
    >
      {children}
    </div>
  );
};

export default HeroBgWrapper;
