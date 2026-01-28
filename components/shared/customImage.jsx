"use client";
import { cn, fixImageUrl } from "@/lib/utils";
import Image from "next/legacy/image";
import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CustomImage = ({
  src,
  alt,
  className,
  loading: loadingImg,
  property,
}) => {
  const [loading, setLoading] = useState(true);
  const resolvedSrc = fixImageUrl(src) || src;

  return (
    <div className="relative w-full h-full">
      {loading && <Skeleton className="absolute inset-0 h-full w-full" />}
      <Image
        src={resolvedSrc}
        alt={alt}
        layout="fill"
        loading={loadingImg ? loadingImg : "lazy"}
        quality={100}
        className={cn(
          className,
          "duration-700 ease-in-out group-hover:opacity-75",
          loading
            ? "scale-110 blur-2xl grayscale"
            : "scale-100 blur-0 grayscale-0"
        )}
        onLoadingComplete={() => setLoading(false)}
        property={property}
      />
    </div>
  );
};

export default CustomImage;
