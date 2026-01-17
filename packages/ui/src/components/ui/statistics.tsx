import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

export interface Statistic {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
    period: string;
  };
  description?: string;
  icon?: React.ReactNode;
  color?: "default" | "primary" | "success" | "warning" | "destructive";
}

export interface StatisticsProps {
  statistics: Statistic[];
  className?: string;
  variant?: "default" | "compact" | "detailed" | "grid";
  columns?: 1 | 2 | 3 | 4;
}

export function Statistics({ statistics, className, variant = "default", columns = 4 }: StatisticsProps) {
  const getChangeIcon = (type: "increase" | "decrease" | "neutral") => {
    switch (type) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decrease":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = (type: "increase" | "decrease" | "neutral") => {
    switch (type) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      case "neutral":
        return "text-gray-600";
    }
  };

  const getCardColor = (color?: string) => {
    switch (color) {
      case "primary":
        return "border-primary bg-primary/5";
      case "success":
        return "border-green-500 bg-green-50";
      case "warning":
        return "border-yellow-500 bg-yellow-50";
      case "destructive":
        return "border-red-500 bg-red-50";
      default:
        return "";
    }
  };

  const getGridCols = () => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("grid gap-4", getGridCols(), className)}>
        {statistics.map(stat => (
          <Card key={stat.id} className={cn(getCardColor(stat.color))}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.change && (
                    <div className="mt-1 flex items-center gap-1">
                      {getChangeIcon(stat.change.type)}
                      <span className={cn("text-sm", getChangeColor(stat.change.type))}>
                        {Math.abs(stat.change.value)}%
                      </span>
                      <span className="text-muted-foreground text-sm">{stat.change.period}</span>
                    </div>
                  )}
                </div>
                {stat.icon && <div className="text-muted-foreground h-8 w-8">{stat.icon}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("grid gap-6", getGridCols(), className)}>
        {statistics.map(stat => (
          <Card key={stat.id} className={cn(getCardColor(stat.color))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon && <div className="text-muted-foreground h-4 w-4">{stat.icon}</div>}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.description && <p className="text-muted-foreground mt-1 text-xs">{stat.description}</p>}
              {stat.change && (
                <div className="mt-2 flex items-center gap-1">
                  {getChangeIcon(stat.change.type)}
                  <span className={cn("text-sm", getChangeColor(stat.change.type))}>
                    {Math.abs(stat.change.value)}%
                  </span>
                  <span className="text-muted-foreground text-sm">from {stat.change.period}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={cn("grid gap-4", getGridCols(), className)}>
        {statistics.map(stat => (
          <div key={stat.id} className={cn("rounded-lg border p-4", getCardColor(stat.color))}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              {stat.icon && <div className="text-muted-foreground h-6 w-6">{stat.icon}</div>}
            </div>
            {stat.change && (
              <div className="mt-2 flex items-center gap-1">
                {getChangeIcon(stat.change.type)}
                <span className={cn("text-sm", getChangeColor(stat.change.type))}>{Math.abs(stat.change.value)}%</span>
                <span className="text-muted-foreground text-sm">{stat.change.period}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", getGridCols(), className)}>
      {statistics.map(stat => (
        <Card key={stat.id} className={cn(getCardColor(stat.color))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon && <div className="text-muted-foreground h-4 w-4">{stat.icon}</div>}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && <CardDescription className="mt-1">{stat.description}</CardDescription>}
            {stat.change && (
              <div className="mt-2 flex items-center gap-1">
                {getChangeIcon(stat.change.type)}
                <span className={cn("text-sm", getChangeColor(stat.change.type))}>{Math.abs(stat.change.value)}%</span>
                <span className="text-muted-foreground text-sm">from {stat.change.period}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
