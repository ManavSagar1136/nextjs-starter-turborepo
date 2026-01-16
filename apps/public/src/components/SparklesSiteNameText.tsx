import { THEME_COLOR } from "@/utils/colors";

import { SparklesText } from "@buildbase/magicui/components/sparkles-text";

import { SiteConfig } from "@/config";
import { cn } from "@buildbase/ui/lib/utils";

// import { AuroraText } from "@buildbase/magicui/components/aurora-text";
// <AuroraText className="uppercase">{SiteConfig.name}</AuroraText>

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
      className={cn("uppercase text-brand-700", className)}
      sparklesCount={sparklesCount}
      colors={colors}
    />
  );
}

// Re-export SparklesText for use in header components
export { SparklesText };

