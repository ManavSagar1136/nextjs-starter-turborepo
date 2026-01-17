import * as React from "react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export interface HeatmapData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface CalendarHeatmapProps {
  data: HeatmapData[];
  startDate?: Date;
  endDate?: Date;
  className?: string;
  onDateClick?: (date: string, count: number) => void;
  colorScheme?: "green" | "blue" | "red" | "purple";
}

export function CalendarHeatmap({
  data,
  startDate,
  endDate,
  className,
  onDateClick,
  colorScheme = "green",
}: CalendarHeatmapProps) {
  const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);

  // Default to last 365 days if no dates provided
  const defaultEndDate = endDate || new Date();
  const defaultStartDate = startDate || new Date(defaultEndDate.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Create a map for quick lookup
  const dataMap = new Map(data.map(item => [item.date, item]));

  // Generate all dates in range
  const generateDates = () => {
    const dates: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
    const current = new Date(defaultStartDate);

    while (current <= defaultEndDate) {
      const dateStr = current.toISOString().split("T")[0];
      const dataItem = dataMap.get(dateStr);

      dates.push({
        date: dateStr,
        count: dataItem?.count || 0,
        level: dataItem?.level || 0,
      });

      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const dates = generateDates();

  // Group dates by weeks
  const groupByWeeks = () => {
    const weeks: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[][] = [];
    let currentWeek: {
      date: string;
      count: number;
      level: 0 | 1 | 2 | 3 | 4;
    }[] = [];

    dates.forEach((date, index) => {
      const dayOfWeek = new Date(date.date).getDay();

      // Start new week on Sunday or if it's the first date
      if (dayOfWeek === 0 || index === 0) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        currentWeek = [];
      }

      currentWeek.push(date);
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = groupByWeeks();

  const getColorClass = (level: number) => {
    const colorMap = {
      green: {
        0: "bg-gray-100",
        1: "bg-green-100",
        2: "bg-green-200",
        3: "bg-green-300",
        4: "bg-green-400",
      },
      blue: {
        0: "bg-gray-100",
        1: "bg-blue-100",
        2: "bg-blue-200",
        3: "bg-blue-300",
        4: "bg-blue-400",
      },
      red: {
        0: "bg-gray-100",
        1: "bg-red-100",
        2: "bg-red-200",
        3: "bg-red-300",
        4: "bg-red-400",
      },
      purple: {
        0: "bg-gray-100",
        1: "bg-purple-100",
        2: "bg-purple-200",
        3: "bg-purple-300",
        4: "bg-purple-400",
      },
    };

    return colorMap[colorScheme][level as keyof typeof colorMap.green];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-2", className)}>
        {/* Legend */}
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div key={level} className={cn("h-3 w-3 rounded-sm", getColorClass(level))} />
            ))}
          </div>
          <span>More</span>
        </div>

        {/* Heatmap */}
        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((date, dayIndex) => (
                <Tooltip key={`${weekIndex}-${dayIndex}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-3 w-3 cursor-pointer rounded-sm transition-colors",
                        getColorClass(date.level),
                        hoveredDate === date.date && "ring-primary ring-2 ring-offset-1"
                      )}
                      onClick={() => onDateClick?.(date.date, date.count)}
                      onMouseEnter={() => setHoveredDate(date.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatDate(date.date)}</p>
                    <p>{date.count} contributions</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
