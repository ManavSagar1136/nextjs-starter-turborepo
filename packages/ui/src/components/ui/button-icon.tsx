import React from "react";
import { Button, ButtonProps } from "./button";

interface ButtonIconProps extends ButtonProps {
  icon: React.ReactElement;
  size: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}

export default function ButtonIcon(props: ButtonIconProps) {
  const { icon, ...rest } = props;
  return (
    <Button {...rest} size={props.size} variant={props.variant}>
      {icon}
    </Button>
  );
}
