"use client";

import { Marquee } from "@/components/magicui/marquee";
import { fixImageUrl, infinityCards } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function InfinityCards({ brands }) {
  const brandsData = brands.brands;
  const router = useRouter();
  return (
    <Marquee pauseOnHover className="[--duration:120s] gap-3">
      {brandsData?.map((card, index) => (
        <div
          onClick={() => router.push(`/brand/${card?.id}`)}
          key={index}
          className="relative w-full h-full border rounded-xl p-2"
        >
          <Image
            src={fixImageUrl(card?.image)}
            alt="image"
            loading="eager"
            width={100}
            height={100}
            className="cursor-pointer w-full h-14 md:h-18 mr-4 object-contain"
          />
        </div>
      ))}
    </Marquee>
  );
}
