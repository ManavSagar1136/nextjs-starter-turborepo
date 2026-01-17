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
        "h-auto bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] rounded-md flex flex-col justify-center items-center text-white py-4 lg:py-6 px-4 lg:px-6",
        classNames,
      )}
    >
      {children}
    </div>
  );
};

export default HeroBgWrapper;
