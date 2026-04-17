interface AvatarProps {
  name?: string;
  image?: string | null;
  size?: "sm" | "md";
}

export function Avatar({ name, image, size = "md" }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  if (image) {
    return <img src={image} alt={name ?? "avatar"} className={`${dim} rounded-full object-cover ring-2 ring-white`} />;
  }

  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ring-2 ring-white`}
    >
      {initials}
    </div>
  );
}
