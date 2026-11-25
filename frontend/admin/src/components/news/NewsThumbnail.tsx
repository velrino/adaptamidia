"use client";

import Image from "next/image";
import { useState } from "react";

const fallbackImage = "/images/company/default.webp";

function getThumbnailSource(image?: string | null): string {
  const source = image?.trim();
  if (!source) return fallbackImage;
  if (source.startsWith("/") && !source.startsWith("//")) return source;

  try {
    const url = new URL(source.startsWith("//") ? `https:${source}` : source);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.protocol === "https:" ? url.href : fallbackImage;
  } catch {
    return fallbackImage;
  }
}

export function NewsThumbnail({ image }: { image?: string | null }) {
  const source = getThumbnailSource(image);
  const [failedSource, setFailedSource] = useState<string>();

  return (
    <Image
      width={100}
      height={100}
      src={source === failedSource ? fallbackImage : source}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setFailedSource(source)}
    />
  );
}
