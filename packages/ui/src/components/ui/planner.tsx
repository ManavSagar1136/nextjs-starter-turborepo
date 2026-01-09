import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PlannerEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  color?: string;
  category?: string;
}

export interface PlannerProps {
  events: PlannerEvent[];
  onEventAdd?: (date: string) => void;
  onEventEdit?: (event: PlannerEvent) => void;
  onEventDelete?: (eventId: string) => void;
  className?: string;
  view?: "week" | "month";
}

export function Planner({ events, onEventAdd, onEventEdit, onEventDelete, className, view = "week" }: PlannerProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }

    return week;
  };

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const current = new Date(startDate);

    // Generate 6 weeks of dates
    for (let week = 0; week < 6; week++) {
      const weekDates = [];
      for (let day = 0; day < 7; day++) {
        weekDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      dates.push(weekDates);
    }

    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter(event => event.date === dateStr);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Badge variant="outline">{view}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (view === "week" ? navigateWeek("prev") : navigateMonth("prev"))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (view === "week" ? navigateWeek("next") : navigateMonth("next"))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === "week" ? (
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <div key={day} className="text-muted-foreground p-2 text-center font-medium">
              {day}
            </div>
          ))}
          {weekDates.map((date, index) => {
            const dateStr = formatDate(date);
            const dayEvents = getEventsForDate(date);
            const isToday = dateStr === formatDate(new Date());
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();

            return (
              <Card
                key={index}
                className={cn(
                  "min-h-[120px] cursor-pointer transition-colors",
                  isToday && "ring-primary ring-2",
                  !isCurrentMonth && "opacity-50"
                )}
                onClick={() => setSelectedDate(dateStr)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{date.getDate()}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={e => {
                        e.stopPropagation();
                        onEventAdd?.(dateStr);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="bg-primary/10 text-primary truncate rounded p-1 text-xs"
                        onClick={e => {
                          e.stopPropagation();
                          onEventEdit?.(event);
                        }}
                      >
                        {event.startTime} - {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-muted-foreground text-xs">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Month header */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-muted-foreground p-2 text-center font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Month grid */}
          {monthDates.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((date, dayIndex) => {
                const dateStr = formatDate(date);
                const dayEvents = getEventsForDate(date);
                const isToday = dateStr === formatDate(new Date());
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                return (
                  <Card
                    key={dayIndex}
                    className={cn(
                      "min-h-[100px] cursor-pointer transition-colors",
                      isToday && "ring-primary ring-2",
                      !isCurrentMonth && "opacity-50"
                    )}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <CardHeader className="pb-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{date.getDate()}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={e => {
                            e.stopPropagation();
                            onEventAdd?.(dateStr);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="bg-primary/10 text-primary truncate rounded p-1 text-xs"
                            onClick={e => {
                              e.stopPropagation();
                              onEventEdit?.(event);
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-muted-foreground text-xs">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
