"use client";

import * as React from "react";
import { Bell, Check, X, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Notification, type Notification as NotificationType } from "@/components/ui/notification";

export interface NotificationCenterProps {
  notifications: NotificationType[];
  onNotificationClick?: (notification: NotificationType) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  onDismiss?: (notificationId: string) => void;
  className?: string;
  variant?: "dropdown" | "popover" | "sidebar";
  maxHeight?: string;
}

export function NotificationCenter({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDismiss,
  className,
  variant = "popover",
  maxHeight = "400px",
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
    onNotificationClick?.(notification);
  };

  const handleDismiss = (notificationId: string) => {
    onDismiss?.(notificationId);
  };

  const content = (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
              <Check className="mr-1 h-4 w-4" />
              Mark all read
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onMarkAllAsRead}>Mark all as read</DropdownMenuItem>
              <DropdownMenuItem onClick={onClearAll}>Clear all</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} className="cursor-pointer" onClick={() => handleNotificationClick(notification)}>
              <Notification
                notification={{
                  ...notification,
                  onDismiss: () => handleDismiss(notification.id),
                }}
                variant="compact"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (variant === "dropdown") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-0" align="end">
          {content}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "sidebar") {
    return <div className="bg-background w-80 border-l">{content}</div>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {content}
      </PopoverContent>
    </Popover>
  );
}
