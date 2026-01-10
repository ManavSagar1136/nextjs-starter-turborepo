import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

export interface RatingProps {
  value?: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

export function Rating({ value = 0, onChange, max = 5, size = "md", readonly = false, className }: RatingProps) {
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoveredValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoveredValue(null);
    }
  };

  const displayValue = hoveredValue ?? value;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }, (_, index) => {
        const rating = index + 1;
        const isFilled = rating <= displayValue;

        return (
          <button
            key={rating}
            type="button"
            className={cn(
              "transition-colors",
              !readonly && "cursor-pointer hover:scale-110",
              readonly && "cursor-default"
            )}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
          >
            <Star
              className={cn(sizeClasses[size], isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
            />
          </button>
        );
      })}
    </div>
  );
}
