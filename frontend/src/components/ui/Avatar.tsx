"use client";

import { useState } from "react";
import { resolveMediaUrl } from "@/src/lib/mediaUrl";

type AvatarSize = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-24 w-24 text-2xl",
};

const pixelSizes: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 96,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`
    .toUpperCase();
}

export function Avatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: AvatarProps) {
  const resolvedUrl = resolveMediaUrl(avatarUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const classes = [
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
    "bg-blue-600 font-bold text-white ring-1 ring-slate-200 dark:ring-slate-700",
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (resolvedUrl && failedUrl !== resolvedUrl) {
    return (
      <span className={classes}>
        {/* Native img keeps the API media host independent from Next image config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`${name} avatar`}
          className="h-full w-full object-cover"
          height={pixelSizes[size]}
          onError={() => setFailedUrl(resolvedUrl)}
          src={resolvedUrl}
          width={pixelSizes[size]}
        />
      </span>
    );
  }

  return (
    <span aria-label={`${name} avatar`} className={classes} role="img">
      {getInitials(name)}
    </span>
  );
}
