import React from "react";
import Link from "next/link";

import { cn } from "@buildbase/ui/lib/utils";

import { Button } from "@buildbase/ui/button";

const CustomButton = ({
  link,
  href,
  classNames,
  children,
}: {
  link: boolean;
  href: string;
  classNames: string;
  children: React.ReactNode;
}) => {
  return (
    <div>
      {link ? (
        <Link
          href={href}
          className={cn(
            "bg-indigo-200 p-3 px-5 text-center rounded-lg text-slate-900 dark:text-slate-50 text-lg font-bold flex justify-center items-center",
            classNames,
          )}
        >
          {children}
        </Link>
      ) : (
        <Button
          variant="secondary"
          className={cn(
            "p-3 px-5 rounded-lg text-center flex justify-center items-center",
            classNames,
          )}
        >
          {children}
        </Button>
      )}
    </div>
  );
};

export default CustomButton;
