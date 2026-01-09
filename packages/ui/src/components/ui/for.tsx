import * as React from "react";

export interface ForProps<T> {
  each: T[];
  children: (item: T, index: number) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function For<T>({ each, children, fallback }: ForProps<T>) {
  if (each.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <>
      {each.map((item, index) => (
        <React.Fragment key={index}>{children(item, index)}</React.Fragment>
      ))}
    </>
  );
}
