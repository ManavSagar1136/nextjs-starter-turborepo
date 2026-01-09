import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: string;
}

const formatPhoneNumber = (value: string) => {
  // Remove all non-numeric characters
  const phoneNumber = value.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX for US numbers
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, defaultCountry = "US", ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(formatPhoneNumber(value));

    React.useEffect(() => {
      setDisplayValue(formatPhoneNumber(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatPhoneNumber(inputValue);
      const numericValue = inputValue.replace(/\D/g, "");

      setDisplayValue(formatted);
      onChange?.(numericValue);
    };

    return (
      <div className="relative">
        <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">🇺🇸</div>
        <Input
          ref={ref}
          type="tel"
          className={cn("pl-10", className)}
          value={displayValue}
          onChange={handleChange}
          placeholder="(555) 123-4567"
          maxLength={14}
          {...props}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";
