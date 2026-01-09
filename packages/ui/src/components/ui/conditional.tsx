import * as React from "react";

export interface ConditionalProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Conditional({ condition, children, fallback }: ConditionalProps) {
  if (condition) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}
