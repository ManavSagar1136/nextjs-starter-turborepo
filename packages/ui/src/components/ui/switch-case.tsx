import * as React from "react";

export interface SwitchCaseProps {
  value: any;
  children: React.ReactNode;
}

export interface CaseProps {
  value: any;
  children: React.ReactNode;
}

export interface DefaultProps {
  children: React.ReactNode;
}

export function SwitchCase({ value, children }: SwitchCaseProps) {
  const childrenArray = React.Children.toArray(children);

  for (const child of childrenArray) {
    if (React.isValidElement(child)) {
      if (child.type === Case && (child as React.ReactElement<CaseProps>).props.value === value) {
        return child;
      }
      if (child.type === Default) {
        return child;
      }
    }
  }

  return null;
}

export function Case({ children }: CaseProps) {
  return <>{children}</>;
}

export function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
