"use client";

import { useCallback } from "react";
import { shareContent } from "@/utils/browser";
import { MoveLeftIcon, Share2 } from "lucide-react";

import CustomButton from "../ui/custom-button";

import { Button } from "@buildbase/ui/button";

/**
 * Renders a button that allows the user to share the blog article via
 * the Web Share API or copy the current URL to the clipboard.
 *
 * @param title - The title of the blog article.
 * @param description - A description of the blog article (optional).
 * @param excerpt - An excerpt of the blog article as a fallback for description (optional).
 *
 * When clicked, attempts to use the `navigator.share` API if available.
 * Otherwise, copies the current URL to the clipboard.
 */
export const ShareBlogButton = ({
  title,
  description,
  excerpt,
}: {
  title: string;
  description?: string;
  excerpt?: string;
}) => {
  const handleShare = useCallback(async () => {
    shareContent({
      title,
      text: description || excerpt || "",
      url: window.location.href,
    });
  }, [title, description, excerpt]);

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
      <Share2 className="h-4 w-4" />
      Share Article
    </Button>
  );
};

/**
 * Renders a button that navigates back to the main blogs page.
 *
 * @returns {JSX.Element} A button labeled 'Go To Blogs' with a left arrow icon.
 */
export const GoToBlogsButton = () => {
  return (
    <CustomButton
      link={true}
      href={"/blogs"}
      classNames="px-6 flex justify-center items-center gap-2"
    >
      <MoveLeftIcon />
      {"Go To Blogs"}
    </CustomButton>
  );
};
