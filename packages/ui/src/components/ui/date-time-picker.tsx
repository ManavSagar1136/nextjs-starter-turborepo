"use client";

import * as React from "react";
import { format, isBefore, isSameDay } from "date-fns";
import { CalendarIcon, Clock, X } from "lucide-react";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

import { cn } from "../../lib/utils";
import { toast } from "../../hooks/use-toast";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  clearable?: boolean;
}

export function DateTimePicker({ date, setDate, clearable = true }: DateTimePickerProps) {
  // State to control the popover
  const [open, setOpen] = React.useState(false);

  // Reference to current time for validation
  const now = React.useMemo(() => new Date(), []);

  // Function to handle time selection
  const handleTimeChange = (time: string) => {
    if (!date) return;

    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);

    // Check if the selected time is in the past for today
    if (isSameDay(newDate, now) && isBefore(newDate, now)) {
      toast({
        title: "Invalid time",
        description: "Please select a time in the future",
        variant: "destructive",
      });
      return;
    }

    setDate(newDate);
  };

  // Function to handle date selection
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      return;
    }

    // If we already have a date, preserve the time
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());

      // If selecting today and the time is in the past, adjust to next available time
      if (isSameDay(newDate, now) && isBefore(newDate, now)) {
        // Round up to the next 30 minutes
        const currentMinutes = now.getMinutes();
        const roundedMinutes = Math.ceil(currentMinutes / 30) * 30;

        newDate.setHours(roundedMinutes === 60 ? now.getHours() + 1 : now.getHours());
        newDate.setMinutes(roundedMinutes % 60);
      }

      setDate(newDate);
    } else {
      // Default to next available time if no previous date
      const newDate = new Date(selectedDate);

      // If selecting today, set to next available time
      if (isSameDay(newDate, now)) {
        // Round up to the next 30 minutes
        const currentMinutes = now.getMinutes();
        const roundedMinutes = Math.ceil(currentMinutes / 30) * 30;

        newDate.setHours(roundedMinutes === 60 ? now.getHours() + 1 : now.getHours());
        newDate.setMinutes(roundedMinutes % 60);
      } else {
        // For future dates, default to 9:00 AM
        newDate.setHours(9);
        newDate.setMinutes(0);
      }

      setDate(newDate);
    }
  };

  // Function to clear the date and close the popover
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setDate(undefined);
    setOpen(false); // Close the popover
  };

  // Generate time options (every 30 minutes)
  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const time = `${formattedHour}:${formattedMinute}`;
        options.push(time);
      }
    }
    return options;
  }, []);

  // Filter time options for today to only show future times
  const filteredTimeOptions = React.useMemo(() => {
    if (!date || !isSameDay(date, now)) return timeOptions;

    return timeOptions.filter(time => {
      const [hours, minutes] = time.split(":").map(Number);
      const timeDate = new Date(now);
      timeDate.setHours(hours);
      timeDate.setMinutes(minutes);
      timeDate.setSeconds(0);
      timeDate.setMilliseconds(0);

      return !isBefore(timeDate, now);
    });
  }, [timeOptions, date, now]);

  // Get current time value for the select
  const timeValue = date
    ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
    : undefined;

  // Find the closest time option
  const closestTimeOption = React.useMemo(() => {
    if (!timeValue) return "12:00";

    const availableOptions = date && isSameDay(date, now) ? filteredTimeOptions : timeOptions;

    // Find exact match
    if (availableOptions.includes(timeValue)) return timeValue;

    // Find closest match
    const [hours, minutes] = timeValue.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;

    return availableOptions.reduce((prev, curr) => {
      const [currHours, currMinutes] = curr.split(":").map(Number);
      const currTotalMinutes = currHours * 60 + currMinutes;

      const [prevHours, prevMinutes] = prev.split(":").map(Number);
      const prevTotalMinutes = prevHours * 60 + prevMinutes;

      return Math.abs(currTotalMinutes - totalMinutes) < Math.abs(prevTotalMinutes - totalMinutes) ? curr : prev;
    }, availableOptions[0]);
  }, [timeValue, timeOptions, filteredTimeOptions, date, now]);

  // Determine if we're showing today's date
  const isToday = date ? isSameDay(date, now) : false;

  return (
    <div className="flex flex-1 flex-col space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP p") : "Schedule date and time"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Schedule Send</h4>
              {date && clearable && (
                <Button variant="ghost" size="icon" onClick={handleClear} className="h-7 w-7" type="button">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {date && (
              <div className="flex items-center space-x-2 pb-4 pt-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <Select value={closestTimeOption} onValueChange={handleTimeChange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="h-80">
                    {(isToday ? filteredTimeOptions : timeOptions).map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isToday && (
              <div className="text-muted-foreground px-1 pb-2 text-xs">Only future times are available for today</div>
            )}
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={date => {
              handleDateSelect(date);
              if (!date) setOpen(false); // Close if date is cleared
            }}
            disabled={date => isBefore(date, new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
