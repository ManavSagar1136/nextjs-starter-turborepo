"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Hash } from "lucide-react";

import { Card, CardContent, CardHeader } from "@buildbase/ui/components/ui/card";

import { cn } from "@buildbase/ui/lib/utils";

interface TOCItem {
  id: string;
  text: string;
  level: number;
  isActive: boolean;
}

interface BlogTableOfContentsProps {
  className?: string;
}

export function BlogTableOfContents({ className }: BlogTableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    // Extract headings from the page
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    )
      .filter((heading) => heading.id) // Only headings with IDs
      .map((heading) => ({
        id: heading.id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.charAt(1)),
        isActive: false,
      }));

    setTocItems(headings);

    // Set up intersection observer for active heading detection
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          setTocItems((prev) =>
            prev.map((item) => ({
              ...item,
              isActive: item.id === id && entry.isIntersecting,
            })),
          );
        });
      },
      {
        rootMargin: "-20% 0px -35% 0px",
        threshold: 0,
      },
    );

    headings.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const getIndentClass = (level: number) => {
    switch (level) {
      case 1:
        return "ml-0";
      case 2:
        return "ml-4";
      case 3:
        return "ml-8";
      case 4:
        return "ml-12";
      case 5:
        return "ml-16";
      case 6:
        return "ml-20";
      default:
        return "ml-0";
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("sticky top-24", className)}
    >
      <Card className="border-0 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Table of Contents</h3>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <nav className="space-y-1">
            {tocItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-primary/10 group",
                  getIndentClass(item.level),
                  item.isActive
                    ? "bg-primary/20 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <Hash
                    className={cn(
                      "h-3 w-3 transition-colors",
                      item.isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate">{item.text}</span>
                </div>
              </motion.button>
            ))}
          </nav>
        </CardContent>
      </Card>
    </motion.div>
  );
}
