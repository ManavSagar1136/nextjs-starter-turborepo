import * as React from "react";
import { cn } from "@/lib/utils";

export interface ClickOutsideProps extends React.HTMLAttributes<HTMLDivElement> {
  onClickOutside?: () => void;
  children: React.ReactNode;
}

export function ClickOutside({ onClickOutside, className, children, ...props }: ClickOutsideProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClickOutside]);

  return (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  );
}
