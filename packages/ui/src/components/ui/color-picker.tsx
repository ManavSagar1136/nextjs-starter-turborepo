import * as React from "react";
import { Check, Palette } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const colors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#6b7280",
  "#374151",
  "#111827",
  "#000000",
  "#ffffff",
];

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({ value = "#000000", onChange, className, disabled = false }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleColorSelect = (color: string) => {
    onChange?.(color);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start", className)} disabled={disabled}>
          <div className="mr-2 h-4 w-4 rounded border" style={{ backgroundColor: value }} />
          <span className="text-sm">{value}</span>
          <Palette className="ml-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-6 gap-2">
          {colors.map(color => (
            <button
              key={color}
              className={cn(
                "h-8 w-8 rounded border-2 transition-all hover:scale-110",
                value === color ? "border-foreground" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
            >
              {value === color && <Check className="h-4 w-4 text-white drop-shadow-sm" />}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <input
            type="color"
            value={value}
            onChange={e => onChange?.(e.target.value)}
            className="h-8 w-full rounded border"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
