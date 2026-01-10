import * as React from "react";
import { cn } from "../../lib/utils";
import { Label } from "@/components/ui/label";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, description, error, required = false, className, children, ...props }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && (
        <Label className={cn(required && "after:ml-0.5 after:text-red-500 after:content-['*']")}>{label}</Label>
      )}
      {children}
      {description && !error && <p className="text-muted-foreground text-sm">{description}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
