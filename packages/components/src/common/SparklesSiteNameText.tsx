import { SiteConfig } from "@buildbase/utils/config";
import { cn } from "@buildbase/ui/lib/utils";
import { SparklesText } from "./sparkles-text";

// Default theme color - can be overridden
const THEME_COLOR = {
  200: "#fef3c7",
  900: "#78350f",
};

interface ISparklesTextProps {
  text?: string;
  className?: string;
  sparklesCount?: number;
  colors?: { first: string; second: string };
}

export function SparklesSiteNameText({
  text = SiteConfig.name,
  className,
  sparklesCount = 3,
  colors = { first: THEME_COLOR[200], second: THEME_COLOR[900] },
}: ISparklesTextProps) {
  return (
    <SparklesText
      text={text}
      className={cn("text-brand-700 uppercase", className)}
      sparklesCount={sparklesCount}
      colors={colors}
    />
  );
}
