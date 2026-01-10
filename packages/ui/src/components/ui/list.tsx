import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { GripVertical } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const listVariants = cva("flex flex-col gap-2", {
  variants: {
    variant: {
      default: "",
      grid: "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ListProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof listVariants> {}

const List = React.forwardRef<HTMLDivElement, ListProps>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(listVariants({ variant, className }))} {...props} />
));
List.displayName = "List";

const ListItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isDragging?: boolean;
    isSelected?: boolean;
    onSelect?: (selected: boolean) => void;
    onDragStart?: (event: React.DragEvent) => void;
    onDragEnd?: (event: React.DragEvent) => void;
    draggable?: boolean;
  }
>(
  (
    {
      className,
      isDragging = false,
      isSelected = false,
      onSelect,
      onDragStart,
      onDragEnd,
      draggable = false,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "group bg-background hover:bg-muted/50 relative flex items-center gap-3 rounded-lg border p-3 transition-colors",
        isDragging && "opacity-50",
        isSelected && "bg-muted",
        className
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...props}
    >
      {onSelect && <Checkbox checked={isSelected} onCheckedChange={onSelect} className="shrink-0" />}
      {draggable && (
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </Button>
      )}
      <div className="flex-1">{children}</div>
    </div>
  )
);
ListItem.displayName = "ListItem";

const ListHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bg-muted/50 flex items-center gap-3 rounded-lg border p-3 font-medium", className)}
      {...props}
    />
  )
);
ListHeader.displayName = "ListHeader";

const ListTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("leading-none font-semibold tracking-tight", className)} {...props} />
  )
);
ListTitle.displayName = "ListTitle";

const ListDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />
  )
);
ListDescription.displayName = "ListDescription";

const ListContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
);
ListContent.displayName = "ListContent";

const ListActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100", className)}
      {...props}
    />
  )
);
ListActions.displayName = "ListActions";

export { List, ListItem, ListHeader, ListTitle, ListDescription, ListContent, ListActions };
