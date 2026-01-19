import Link from "next/link";
import { Routes } from "@/data/routes";

import { Logo, LogoSmall } from "@/components/logo/Logo";
import { SparklesSiteNameText } from "@buildbase/components/common/SparklesSiteNameText";

import { cn } from "@buildbase/ui/lib/utils";

{
  /* Logo and Brand */
}
export const BrandNameWithIcon = ({
  className,
  isSmall,
  disabled,
}: {
  className?: string;
  isSmall?: boolean;
  disabled?: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex items-center",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <div className="w-8 h-8 mr-2 overflow-hidden">
        {isSmall ? <LogoSmall /> : <Logo />}
      </div>
      <Link href={Routes.root} className="font-extrabold">
        <SparklesSiteNameText className="dark:text-brand-100" />
      </Link>
    </div>
  );
};
