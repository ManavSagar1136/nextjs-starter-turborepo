"use client";

import React, { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@buildbase/ui/components/ui/select";
import { API } from "@/services";
import type { EmailStats } from "@/services/email";

const EmailStatsPage = () => {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<string>("month");

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await API.email.stats.getStats({ period: period as "today" | "week" | "month" | "year" });
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch email stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-muted-foreground py-8 text-center">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-muted-foreground py-8 text-center">No statistics available.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <BarChart3 className="h-5 w-5" />
              Email Statistics
            </h1>
            <p className="text-muted-foreground mt-1">View email performance metrics and analytics</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm">Total Emails</p>
            <div className="text-2xl font-bold">{(stats.total ?? 0).toLocaleString()}</div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm">Sent</p>
            <div className="text-2xl font-bold text-green-600">{(stats.sent ?? 0).toLocaleString()}</div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm">Delivered</p>
            <div className="text-2xl font-bold text-blue-600">{(stats.delivered ?? 0).toLocaleString()}</div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm">Failed</p>
            <div className="text-2xl font-bold text-red-600">{(stats.failed ?? 0).toLocaleString()}</div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm">Bounced</p>
            <div className="text-2xl font-bold text-orange-600">{(stats.bounced ?? 0).toLocaleString()}</div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm">Queued</p>
            <div className="text-2xl font-bold text-yellow-600">{(stats.queued ?? 0).toLocaleString()}</div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm">Opens</p>
            <div className="text-2xl font-bold">{(stats.tracking?.opens ?? 0).toLocaleString()}</div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-sm">Clicks</p>
            <div className="text-2xl font-bold">{(stats.tracking?.clicks ?? 0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailStatsPage;
