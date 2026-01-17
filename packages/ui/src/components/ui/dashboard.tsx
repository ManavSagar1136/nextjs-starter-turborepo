import * as React from "react";
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";

export interface DashboardMetric {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period: string;
  };
  icon?: React.ReactNode;
  description?: string;
}

export interface DashboardChart {
  title: string;
  data: any[];
  type: "line" | "bar" | "area" | "pie";
  height?: number;
}

export interface DashboardProps {
  metrics: DashboardMetric[];
  charts?: DashboardChart[];
  recentActivity?: {
    title: string;
    items: {
      id: string;
      description: string;
      timestamp: string;
      type: "info" | "success" | "warning" | "error";
    }[];
  };
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

export function Dashboard({ metrics, charts = [], recentActivity, className, variant = "default" }: DashboardProps) {
  const getChangeIcon = (type: "increase" | "decrease") => {
    return type === "increase" ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (type: "increase" | "decrease") => {
    return type === "increase" ? "text-green-600" : "text-red-600";
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    {metric.change && (
                      <div className="mt-1 flex items-center gap-1">
                        {getChangeIcon(metric.change.type)}
                        <span className={cn("text-sm", getChangeColor(metric.change.type))}>
                          {Math.abs(metric.change.value)}%
                        </span>
                        <span className="text-muted-foreground text-sm">{metric.change.period}</span>
                      </div>
                    )}
                  </div>
                  {metric.icon && <div className="text-muted-foreground h-8 w-8">{metric.icon}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                {metric.icon && <div className="text-muted-foreground h-4 w-4">{metric.icon}</div>}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.description && <p className="text-muted-foreground mt-1 text-xs">{metric.description}</p>}
                {metric.change && (
                  <div className="mt-2 flex items-center gap-1">
                    {getChangeIcon(metric.change.type)}
                    <span className={cn("text-sm", getChangeColor(metric.change.type))}>
                      {Math.abs(metric.change.value)}%
                    </span>
                    <span className="text-muted-foreground text-sm">from {metric.change.period}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        {charts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {charts.map((chart, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{chart.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center" style={{ height: chart.height || 300 }}>
                    <p className="text-muted-foreground">{chart.type} chart placeholder</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity && (
          <Card>
            <CardHeader>
              <CardTitle>{recentActivity.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Badge variant="secondary" className={getActivityColor(item.type)}>
                      {item.type}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{item.description}</p>
                      <p className="text-muted-foreground text-xs">{item.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon && <div className="text-muted-foreground h-4 w-4">{metric.icon}</div>}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <div className="mt-2 flex items-center gap-1">
                  {getChangeIcon(metric.change.type)}
                  <span className={cn("text-sm", getChangeColor(metric.change.type))}>
                    {Math.abs(metric.change.value)}%
                  </span>
                  <span className="text-muted-foreground text-sm">from {metric.change.period}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {charts.map((chart, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center" style={{ height: chart.height || 300 }}>
                  <p className="text-muted-foreground">{chart.type} chart placeholder</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && (
        <Card>
          <CardHeader>
            <CardTitle>{recentActivity.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <Badge variant="secondary" className={getActivityColor(item.type)}>
                    {item.type}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm">{item.description}</p>
                    <p className="text-muted-foreground text-xs">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
