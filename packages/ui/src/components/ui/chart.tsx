import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

// Chart container
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: Record<string, any>;
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      {children}
    </div>
  );
});
ChartContainer.displayName = "Chart";

// Chart style component
const ChartStyle = ({ id, config }: { id: string; config: Record<string, any> }) => {
  const colorConfig = React.useMemo(() => {
    const style = document.documentElement.style;
    const colorMap: Record<string, string> = {};

    if (config?.theme) {
      for (const [key, value] of Object.entries(config.theme)) {
        if (typeof value === "string" && value.startsWith("hsl")) {
          const token = value.replace("hsl(var(", "").replace("))", "");
          const color = style.getPropertyValue(token).trim();
          colorMap[key] = color;
        }
      }
    }

    return colorMap;
  }, [config]);

  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      [data-chart="${id}"] {
        ${Object.entries(colorConfig)
          .map(([key, value]) => `--color-${key}: ${value};`)
          .join("\n")}
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [id, colorConfig]);

  return null;
};

// Chart tooltip
const ChartTooltip = RechartsPrimitive.Tooltip;

// Chart tooltip content
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const value = typeof label === "string" ? label : labelFormatter ? labelFormatter(label, payload) : key;

      return value;
    }, [label, labelFormatter, payload, hideLabel, labelKey]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = (payload: any, parentKey?: string) => {
      const items = payload.map((item: any, index: number) => {
        const key = parentKey
          ? `${parentKey}.${item.dataKey || item.name || index}`
          : item.dataKey || item.name || index;

        if (item.payload && typeof item.payload === "object" && item.children) {
          return (
            <div key={key} className="grid gap-1.5">
              <div className="font-medium capitalize">{item.name || item.dataKey}</div>
              <div className="grid gap-1">{nestLabel(item.children, key)}</div>
            </div>
          );
        }

        const indicatorColor = color || item.payload?.fill || item.color;

        return (
          <div
            key={key}
            className={cn(
              "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
              indicator === "dot" && "items-center"
            )}
          >
            {formatter && item?.value !== undefined && item.name ? (
              formatter(item.value, item.name, item, index, item.payload)
            ) : (
              <>
                {!hideIndicator && (
                  <div
                    className={cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", {
                      "h-2.5 w-2.5": indicator === "dot",
                      "w-1": indicator === "line",
                      "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                    })}
                    style={
                      {
                        "--color-bg": indicatorColor,
                        "--color-border": indicatorColor,
                      } as React.CSSProperties
                    }
                  />
                )}
                <div
                  className={cn(
                    "flex flex-1 justify-between leading-none",
                    hideIndicator ? "items-end" : "items-center"
                  )}
                >
                  <div className="grid gap-1.5">
                    <div className="text-muted-foreground">{nameKey ? item.payload?.[nameKey] : item.name}</div>
                    {item.value && <div className="font-mono text-[--color-text]">{item.value}</div>}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      });

      return items;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-[--color-border] bg-[--color-bg] p-2.5 shadow-xl",
          className
        )}
        style={
          {
            "--color-bg": "hsl(var(--background))",
            "--color-border": "hsl(var(--border))",
            "--color-text": "hsl(var(--foreground))",
          } as React.CSSProperties
        }
      >
        {tooltipLabel && <div className={cn("font-medium", labelClassName)}>{tooltipLabel}</div>}
        <div className="grid gap-1.5">{nestLabel(payload)}</div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

// Chart legend
const ChartLegend = RechartsPrimitive.Legend;

// Chart legend content
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}
    >
      {payload.map(item => (
        <div
          key={item.value}
          className={cn("[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3")}
        >
          {!hideIcon && (
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: item.color,
              }}
            />
          )}
          {nameKey ? (item.payload as any)?.[nameKey] : item.value}
        </div>
      ))}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
