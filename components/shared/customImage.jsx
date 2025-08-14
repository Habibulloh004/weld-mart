"use client";
import { cn } from "@/lib/utils";
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
  
  // URL ni tekshirish va almashtirish
  const getModifiedSrc = (originalSrc) => {
    if (!originalSrc) return originalSrc;
    
    // Agar src da "https://weldmarket.uz" bo'lsa, uni "https://weldmart.uz" ga almashtirish
    return originalSrc.replace(/https:\/\/weldmarket\.uz/g, "https://weldmart.uz");
  };

  const modifiedSrc = getModifiedSrc(src);

  return (
    <div className="relative w-full h-full">
      {loading && <Skeleton className="absolute inset-0 h-full w-full" />}
      <Image
        src={modifiedSrc}
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