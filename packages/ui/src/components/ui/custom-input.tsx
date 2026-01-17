"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "../../lib/utils";

export interface CustomInputProps extends React.ComponentProps<"input"> {
  className?: string;
}

/**
 * Password input component with visibility toggle
 * Used internally by CustomInput for password type
 */
const InputPassword = React.forwardRef<HTMLInputElement, CustomInputProps>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleToggleVisibility = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(prev => !prev);
  }, []);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      setShowPassword(prev => !prev);
    }
  }, []);

  return (
    <div className="relative">
      <Input {...props} type={showPassword ? "text" : "password"} className={cn("pr-10", className)} ref={ref} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={handleToggleVisibility}
        onKeyDown={handleKeyDown}
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={0}
        disabled={props.disabled}
      >
        {showPassword ? (
          <EyeOff className="text-muted-foreground h-4 w-4" />
        ) : (
          <Eye className="text-muted-foreground h-4 w-4" />
        )}
      </Button>
    </div>
  );
});

InputPassword.displayName = "InputPassword";

/**
 * CustomInput - A reusable input component that renders different input types
 *
 * Features:
 * - Renders normal Input for all standard types (text, email, number, etc.)
 * - Renders InputPassword with visibility toggle for password type
 * - Extensible for future custom input types
 *
 * @example
 * ```tsx
 * <CustomInput type="text" placeholder="Enter text" />
 * <CustomInput type="password" placeholder="Enter password" />
 * <CustomInput type="email" placeholder="Enter email" />
 * ```
 */
const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(({ type = "text", ...props }, ref) => {
  // Handle password type with visibility toggle
  if (type === "password") {
    return <InputPassword ref={ref} type={type} {...props} />;
  }

  // Handle all other input types with standard Input component
  // Future custom types can be added here
  // Example:
  // if (type === "custom-type") {
  //   return <CustomTypeInput ref={ref} type={type} {...props} />;
  // }

  return <Input ref={ref} type={type} {...props} />;
});

CustomInput.displayName = "CustomInput";

export { CustomInput, InputPassword };
