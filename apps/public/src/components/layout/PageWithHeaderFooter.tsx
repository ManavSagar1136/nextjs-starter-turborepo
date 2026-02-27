import { Footer } from "@/components/layout/Footer";
import { NavBar } from "@/components/layout/NavBar/NavBar";

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
        "flex flex-col items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]",
        !noWrapper && "gap-10",
        wrapperClassName,
      )}
      style={{ background: "var(--mk-bg-primary)", color: "var(--mk-text-primary)" }}
    >
      <NavBar />
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
