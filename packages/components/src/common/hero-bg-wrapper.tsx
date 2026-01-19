import React from "react";

import { cn } from "@buildbase/ui/lib/utils";

interface HeroBgWrapperProps {
  children: React.ReactNode;
  classNames?: string;
}

export const HeroBgWrapper = ({ children, classNames }: HeroBgWrapperProps) => {
  return (
    <div
      className={cn(
        "flex h-auto flex-col items-center justify-center rounded-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 py-4 text-white lg:px-6 lg:py-6",
        classNames
      )}
    >
      {children}
    </div>
  );
};

export default HeroBgWrapper;
