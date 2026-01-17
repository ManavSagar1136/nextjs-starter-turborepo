import { Footer } from "@/components/layout/Footer";
import Header from "@/components/layout/Header/Header";

import { cn } from "@buildbase/ui/lib/utils";

export default function PageWithHeaderFooter({
  isContainer = true,
  children,
  noWrapper = false,
  className,
  wrapperClassName,
}: Readonly<{
  isContainer?: boolean;
  children: React.ReactNode;
  noWrapper?: boolean;
  className?: string;
  wrapperClassName?: string;
}>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-items-center min-h-screen gap-10 font-[family-name:var(--font-geist-sans)]",
        wrapperClassName,
      )}
    >
      <Header />
      {noWrapper ? (
        children
      ) : (
        <div
          className={cn(
            isContainer
              ? "custom-container overflow-hidden"
              : "w-full max-w-[1280px]",
            className,
          )}
        >
          {children}
        </div>
      )}
      <Footer />
    </div>
  );
}
