"use client";

import { useCallback, useState } from "react";
import {
  DATA_TABLE_KEYS,
  TANSTACK_KEYS,
} from "@/constant/tanstack/tanstack-api-keys";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Crown,
  Database,
  Info,
  Package,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

import { API } from "@/services";
import type { IPageFilter } from "@/services/axios/paginationAPI";
import type { PaginationResponse } from "@/services/axios/types";

import { DataTable } from "@/components/table/DataTable";
import { Badge } from "@buildbase/ui/badge";
import { Button } from "@buildbase/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@buildbase/ui/popover";
import { Progress } from "@buildbase/ui/progress";

import {
  DEFAULT_VALUES,
  FEATURE_CATEGORIES,
  formatApiCallsValue,
  formatStorageValue,
  USAGE_KEYS,
} from "@/lib/feature-management/constants";
import { cn } from "@buildbase/ui/lib/utils";
import type {
  FeatureInfo,
  SummaryData,
} from "@/hooks/use-organization-features";

/**
 * Interface for feature category configuration.
 */
interface FeatureCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * Configuration for feature categories, including their name, icon, and color.
 */
const FEATURE_CATEGORIES_CONFIG: Record<string, FeatureCategory> = {
  [FEATURE_CATEGORIES.USER_MANAGEMENT]: {
    id: FEATURE_CATEGORIES.USER_MANAGEMENT,
    name: "User Management",
    icon: Users,
    color: "text-blue-600",
  },
  [FEATURE_CATEGORIES.API_FEATURES]: {
    id: FEATURE_CATEGORIES.API_FEATURES,
    name: "API Features",
    icon: Zap,
    color: "text-green-600",
  },
  [FEATURE_CATEGORIES.STORAGE_FEATURES]: {
    id: FEATURE_CATEGORIES.STORAGE_FEATURES,
    name: "Storage",
    icon: Database,
    color: "text-purple-600",
  },
  [FEATURE_CATEGORIES.ADDON_FEATURES]: {
    id: FEATURE_CATEGORIES.ADDON_FEATURES,
    name: "Add-ons",
    icon: Activity,
    color: "text-indigo-600",
  },
  [FEATURE_CATEGORIES.PREMIUM_FEATURES]: {
    id: FEATURE_CATEGORIES.PREMIUM_FEATURES,
    name: "Premium",
    icon: Crown,
    color: "text-yellow-600",
  },
};

/**
 * Get the primary usage type for a given feature.
 * The primary usage type is determined by:
 *   1. the first key in `limits`
 *   2. or a key in `currentUsage` that has a value > 0
 *   3. or empty string if none present
 * @param feature FeatureInfo object
 * @returns Usage type string, or empty string if none found
 */
const getPrimaryUsageType = (feature: FeatureInfo): string => {
  const usageTypes = Object.keys(feature.limits);
  return (
    usageTypes[0] ||
    usageTypes.find((type) => feature.currentUsage[type] > 0) ||
    ""
  );
};

interface FeatureDetailsPopoverProps {
  feature: FeatureInfo;
  getFeatureStatusIcon: (feature: FeatureInfo) => React.ReactNode;
  getFeatureUsage: (
    feature: FeatureInfo,
    usageType: string,
  ) => {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
    isInfinite: boolean;
  };
  getUsageTypeLabel: (usageType: string) => string;
  formatUsageValue: (value: number, usageType: string) => string;
}

/**
 * Popover component which renders detailed information and usage stats for a feature.
 * @param props FeatureDetailsPopoverProps
 */
const FeatureDetailsPopover = ({
  feature,
  getFeatureStatusIcon,
  getFeatureUsage,
  getUsageTypeLabel,
  formatUsageValue,
}: FeatureDetailsPopoverProps) => {
  const usageTypes = Object.keys(feature.limits);
  const primaryUsageType =
    usageTypes[0] ||
    usageTypes.find((type) => feature.currentUsage[type] > 0) ||
    "";

  if (!primaryUsageType) {
    return (
      <div className="w-80 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-semibold">{feature.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {feature.description}
            </p>
          </div>
          {getFeatureStatusIcon(feature)}
        </div>
        <div className="text-sm text-muted-foreground">
          No usage data available
        </div>
      </div>
    );
  }

  const usage = getFeatureUsage(feature, primaryUsageType);

  return (
    <div className="w-80 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-semibold text-primary">
            {feature.name}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            {feature.description}
          </p>
        </div>
        {getFeatureStatusIcon(feature)}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {getUsageTypeLabel(primaryUsageType)}
          </span>
          <span className="font-medium">
            {formatUsageValue(usage.used, primaryUsageType)} /{" "}
            {formatUsageValue(usage.limit, primaryUsageType)}
          </span>
        </div>
        <Progress
          value={usage.percentage}
          className={`h-2 ${usage.percentage > 80 ? "bg-red-100" : ""}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {usage.isInfinite ? "Unlimited" : `${usage.percentage}% used`}
          </span>
          <span>
            {formatUsageValue(usage.remaining, primaryUsageType)} remaining
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * SimpleFeatureUsageView
 *
 * Main component for displaying an overview of feature usage and limits.
 * Shows a data table with features, usage, and limits.
 */
export function SimpleFeatureUsageView() {
  // Store summary data in state so we can access it in the header and trigger re-renders
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  /**
   * Get the icon for a feature's status (allowed, canceled, not allowed).
   * @param feature FeatureInfo
   * @returns ReactNode (icon)
   */
  const getFeatureStatusIcon = (feature: FeatureInfo): React.ReactNode => {
    if (feature.allowed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (feature.status === "CANCELED") {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  /**
   * Format a usage value for display, with special formatting for bytes, API calls, and unlimited values.
   * @param value number value
   * @param usageType type for this usage
   * @returns Formatted label string
   */
  const formatUsageValue = (value: number, usageType: string): string => {
    // Handle infinite values
    if (value === DEFAULT_VALUES.INFINITE_QUANTITY) {
      return "Unlimited";
    }

    if (usageType === USAGE_KEYS.STORAGE_BYTES) {
      return formatStorageValue(value);
    }
    if (usageType === USAGE_KEYS.API_CALLS) {
      return formatApiCallsValue(value);
    }
    return value.toLocaleString();
  };

  /**
   * Get a human-readable label for a usage type key.
   * @param usageType key
   * @returns Label string
   */
  const getUsageTypeLabel = (usageType: string): string => {
    const labels: Record<string, string> = {
      [USAGE_KEYS.SEATS]: "Seats",
      [USAGE_KEYS.API_CALLS]: "API Calls",
      [USAGE_KEYS.STORAGE_BYTES]: "Storage",
      [USAGE_KEYS.USAGE]: "Usage",
    };
    return labels[usageType] || usageType;
  };

  /**
   * Get feature usage calculation data for the given usage type.
   * Uses API-calculated values only (no fallback).
   * @param feature FeatureInfo
   * @param usageType string key
   * @returns Usage stats object
   */
  const getFeatureUsage = (
    feature: FeatureInfo,
    usageType: string,
  ): {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
    isInfinite: boolean;
  } => {
    const used = feature.currentUsage[usageType] || 0;
    const limit = feature.limits[usageType] || 0;
    const remaining = feature.remaining?.[usageType] ?? 0;
    // Only two decimal points for percentage
    const percentageRaw = feature.percentage?.[usageType] ?? 0;
    const percentage = Number(percentageRaw.toFixed(2));
    return {
      used,
      limit,
      remaining,
      percentage,
      isInfinite: limit === DEFAULT_VALUES.INFINITE_QUANTITY,
    };
  };

  /**
   * Column definitions for the DataTable.
   */
  const columns: ColumnDef<FeatureInfo>[] = [
    {
      accessorKey: "name",
      header: "Feature Name",
      /**
       * Renders the cell for the Feature Name column.
       */
      cell: ({ row }) => {
        const feature = row.original;
        const categoryConfig = FEATURE_CATEGORIES_CONFIG[feature.category];
        const Icon = categoryConfig?.icon || Package;
        const iconColor = categoryConfig?.color || "text-muted-foreground";

        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <span className="font-medium text-primary">{feature.name}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-transparent"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="View feature details"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <FeatureDetailsPopover
                  feature={feature}
                  getFeatureStatusIcon={getFeatureStatusIcon}
                  getFeatureUsage={getFeatureUsage}
                  getUsageTypeLabel={getUsageTypeLabel}
                  formatUsageValue={formatUsageValue}
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      },
    },
    {
      accessorKey: "usage",
      header: "Usage",
      /**
       * Renders the cell for the Usage column, showing usage progress and labeling.
       */
      cell: ({ row }) => {
        const feature = row.original;
        const primaryUsageType = getPrimaryUsageType(feature);

        if (!primaryUsageType) {
          return (
            <span className="text-sm text-muted-foreground">
              No usage data available
            </span>
          );
        }

        const usage = getFeatureUsage(feature, primaryUsageType);

        return (
          <div className="space-y-1">
            <div className="flex flex-row flex-wrap justify-between gap-y-1.5 gap-x-2 text-sm">
              <span className="text-xs text-muted-foreground">
                ({usage.isInfinite ? "Unlimited" : `${usage.percentage}% used`})
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-primary">
                  {formatUsageValue(usage.used, primaryUsageType)} /{" "}
                  {formatUsageValue(usage.limit, primaryUsageType)}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  ({formatUsageValue(usage.remaining, primaryUsageType)}{" "}
                  remaining)
                </span>
              </div>
            </div>
            <div className="w-full">
              <Progress
                value={usage.percentage}
                className={cn(
                  "h-2 dark:bg-white/30",
                  usage.percentage > 80 ? "bg-red-100" : "",
                )}
                indicatorClassName={cn("dark:bg-white")}
              />
            </div>
          </div>
        );
      },
    },
  ];

  /**
   * getData - Returns paginated data for DataTable.
   * Fetches feature summary from API and paginates according to filter.
   * @param filter IPageFilter object specifying pagination params
   * @returns Promise<PaginationResponse<FeatureInfo>>
   */
  const getData = useCallback(
    async (filter: IPageFilter): Promise<PaginationResponse<FeatureInfo>> => {
      // Fetch feature summary from API directly
      const response = await API.organizations.features.getFeatureSummary();
      const fetchedSummaryData = response.data as SummaryData;

      // Store summary data in state for use in header
      setSummaryData(fetchedSummaryData);

      // Flatten all features into a single array for the table
      const allFeatures = fetchedSummaryData?.features || [];

      const page = filter.$page || 1;
      const limit = filter.$limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFeatures = allFeatures.slice(startIndex, endIndex);

      return {
        docs: paginatedFeatures,
        totalDocs: allFeatures.length,
        limit,
        page,
        pagingCounter: startIndex + 1,
        totalPages: Math.ceil(allFeatures.length / limit),
        hasNextPage: endIndex < allFeatures.length,
        hasPrevPage: page > 1,
        nextPage: endIndex < allFeatures.length ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      };
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Feature Usage</h2>
          <p className="text-muted-foreground mt-1">
            Your current feature usage and limits
          </p>
        </div>
        {summaryData && (
          <Badge variant="outline" className="text-sm">
            {summaryData.totalFeatures} Total
          </Badge>
        )}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        availableFilters={[]}
        queryProps={{
          queryKey: [...TANSTACK_KEYS.features.summary()],
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          refetchOnMount: "always",
          refetchInterval: 60000,
          staleTime: 0,
        }}
        limitPerPage={10}
        getData={getData}
        tableId={DATA_TABLE_KEYS.features}
        hideIfEmpty={false}
        classNames={{
          mobileCardContainer: "[&_.data-table-mobile-cell-container]:w-full",
        }}
        showRefreshButton
      />
    </div>
  );
}
