import React from "react";
import { FileQuestion } from "lucide-react";

import { cn } from "@buildbase/ui/lib/utils";

const DocsEmpty = ({
  title = "No documentation found",
  description = "There are no documentation pages available at the moment.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[75vh] gap-4 p-8",
        className,
      )}
    >
      <FileQuestion className="w-16 h-16 text-slate-400 dark:text-slate-600" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-slate-400 dark:text-slate-600 max-w-md">{description}</p>
      </div>
    </div>
  );
};

export default DocsEmpty;
