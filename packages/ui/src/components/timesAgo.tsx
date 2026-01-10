import ReactTimeAgo from "react-time-ago";

import { cn } from "../lib/utils";

interface TimesAgoProps {
  onlyInTime?: boolean;
  date: string | number | Date;
  align?: "left" | "center" | "right";
}

export default function TimesAgo(props: TimesAgoProps) {
  const { date } = props;
  const onlyInTime = props.onlyInTime || false;
  const align = props.align || "left";
  const dateObj = new Date(date);
  return (
    <div
      className={cn("flex flex-col", "whitespace-nowrap", {
        "justify-start": align === "left",
        "items-center justify-center": align === "center",
        "justify-end": align === "right",
      })}
    >
      <ReactTimeAgo date={dateObj} locale="en-US" />
      {!onlyInTime && <div className="text-xs font-extralight">{new Date(dateObj).toLocaleString()}</div>}
    </div>
  );
}
