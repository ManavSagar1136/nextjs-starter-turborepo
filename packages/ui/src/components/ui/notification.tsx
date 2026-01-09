import * as React from "react";
import { X, Check, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "warning" | "info";
  timestamp?: Date;
  read?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export interface NotificationProps {
  notification: Notification;
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

export function Notification({ notification, className, variant = "default" }: NotificationProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3",
          getTypeColor(),
          !notification.read && "bg-background",
          className
        )}
      >
        {getIcon()}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{notification.title}</p>
          {notification.message && <p className="text-muted-foreground truncate text-xs">{notification.message}</p>}
        </div>
        {!notification.read && <div className="bg-primary h-2 w-2 rounded-full" />}
        {notification.onDismiss && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={notification.onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "space-y-3 rounded-lg border p-4",
          getTypeColor(),
          !notification.read && "bg-background",
          className
        )}
      >
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
                {notification.timestamp && (
                  <span className="text-muted-foreground text-xs">{formatTimestamp(notification.timestamp)}</span>
                )}
              </div>
            </div>
            {notification.message && <p className="text-muted-foreground text-sm">{notification.message}</p>}
          </div>
          {notification.onDismiss && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={notification.onDismiss}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {notification.action && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={notification.action.onClick}>
              {notification.action.label}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        getTypeColor(),
        !notification.read && "bg-background",
        className
      )}
    >
      {getIcon()}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{notification.title}</h4>
          <div className="flex items-center gap-2">
            {!notification.read && <div className="bg-primary h-2 w-2 rounded-full" />}
            {notification.onDismiss && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={notification.onDismiss}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {notification.message && <p className="text-muted-foreground text-sm">{notification.message}</p>}
        {notification.timestamp && (
          <p className="text-muted-foreground text-xs">{formatTimestamp(notification.timestamp)}</p>
        )}
        {notification.action && (
          <Button variant="outline" size="sm" onClick={notification.action.onClick} className="mt-2">
            {notification.action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
