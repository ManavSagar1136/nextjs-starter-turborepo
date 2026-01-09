import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import TimesAgo from "@/components/timesAgo";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

interface ColumnCreateAtProps {
  key?: string;
  title?: string;
  align?: "left" | "center" | "right";
}

export function ColumnCreateAt<
  T extends {
    [key: string]: any;
  },
>(props?: ColumnCreateAtProps): ColumnDef<T> {
  let key = props?.key ?? "createdAt";
  let title = props?.title ?? "Created On";
  let align = props?.align ?? "center";
  return {
    accessorKey: key,
    header: ({ column }) => {
      return (
        <div
          key={key}
          className={cn("flex", {
            "justify-start": align === "left",
            "items-center justify-center": align === "center",
            "justify-end": align === "right",
          })}
        >
          <Button
            variant="ghost"
            className="rounded-none text-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="line-clamp-1">{title}</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const item = row.original;
      if (!item) return null;
      if (!item[key]) return null;
      const value = item?.[key] ?? "";
      return <TimesAgo align={align} date={value} />;
    },
  };
}
