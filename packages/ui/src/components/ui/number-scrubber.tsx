import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface NumberScrubberProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  className?: string;
}

export const NumberScrubber = React.forwardRef<HTMLInputElement, NumberScrubberProps>(
  ({ className, value = 0, onChange, min = -Infinity, max = Infinity, step = 1, precision = 0, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0, value: 0 });

    const formatValue = (val: number) => {
      return precision > 0 ? val.toFixed(precision) : val.toString();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        value: value,
      });
      e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = dragStart.y - e.clientY; // Inverted for natural feel
      const delta = deltaX + deltaY;

      const newValue = Math.max(min, Math.min(max, dragStart.value + delta * step * 0.01));

      const roundedValue =
        precision > 0 ? Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision) : Math.round(newValue);

      onChange?.(roundedValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove as any);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
          document.removeEventListener("mousemove", handleMouseMove as any);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isDragging, dragStart]);

    const increment = () => {
      const newValue = Math.min(max, value + step);
      const roundedValue =
        precision > 0 ? Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision) : Math.round(newValue);
      onChange?.(roundedValue);
    };

    const decrement = () => {
      const newValue = Math.max(min, value - step);
      const roundedValue =
        precision > 0 ? Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision) : Math.round(newValue);
      onChange?.(roundedValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = parseFloat(e.target.value);
      if (!isNaN(inputValue)) {
        const clampedValue = Math.max(min, Math.min(max, inputValue));
        onChange?.(clampedValue);
      }
    };

    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button variant="outline" size="sm" onClick={decrement} disabled={value <= min} className="h-8 w-8 p-0">
          <Minus className="h-4 w-4" />
        </Button>

        <Input
          ref={ref}
          type="number"
          value={formatValue(value)}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          className={cn("w-20 cursor-ew-resize text-center", isDragging && "bg-accent")}
          onMouseDown={handleMouseDown}
          {...props}
        />

        <Button variant="outline" size="sm" onClick={increment} disabled={value >= max} className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);
NumberScrubber.displayName = "NumberScrubber";
