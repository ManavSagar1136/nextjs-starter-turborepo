"use client";

import Link from "next/link";

import { cn } from "@buildbase/ui/lib/utils";

interface Avatar {
  imageUrl: string;
  profileUrl: string;
  name: string;
}
interface AvatarCirclesProps {
  className?: string;
  numPeople?: number;
  avatarUrls: Avatar[];
}

export const AvatarCircles = ({ numPeople, className, avatarUrls }: AvatarCirclesProps) => {
  return (
    <div className={cn("z-10 flex -space-x-3 rtl:space-x-reverse", className)}>
      {avatarUrls.map((url, index) => (
        <Link key={url.name} href={url.profileUrl} target="_blank" rel="noopener noreferrer" title={url.name}>
          <img
            key={index}
            className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800"
            src={url.imageUrl}
            width={40}
            height={40}
            alt={`Avatar ${index + 1}`}
          />
        </Link>
      ))}
      {(numPeople ?? 0) > 0 && (
        <Link
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black text-center text-xs font-medium text-white hover:bg-gray-600 dark:border-gray-800 dark:bg-white dark:text-black"
          href=""
        >
          +{numPeople}
        </Link>
      )}
    </div>
  );
};
