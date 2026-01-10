import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  className?: string;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  className,
  loader,
  endMessage,
}: InfiniteScrollProps) {
  const observerRef = React.useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin: "100px",
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [threshold]);

  React.useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore]);

  const defaultLoader = (
    <div className="flex items-center justify-center py-8">
      <div className="text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading more...</span>
      </div>
    </div>
  );

  const defaultEndMessage = (
    <div className="flex items-center justify-center py-8">
      <p className="text-muted-foreground">No more items to load</p>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {children}

      {hasMore && <div ref={observerRef}>{isLoading ? loader || defaultLoader : null}</div>}

      {!hasMore && !isLoading && (endMessage || defaultEndMessage)}
    </div>
  );
}
