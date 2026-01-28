"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";
import CustomImage from "@/components/shared/customImage";

export default function News({ news }) {
  if (!news || news.length === 0) return null;

  const featuredNews = useMemo(() => {
    if (!Array.isArray(news) || news.length === 0) {
      return null;
    }

    return news
      .slice()
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
  }, [news]);

  return (
    <main className="space-y-6 px-4 lg:px-0">
      <section className="flex justify-between items-center gap-5 text-black/80">
        <h1 className="font-medium textNormal3 sm:textNormal4">Блог и новости</h1>
        <Link className="textSmall2 flex items-center gap-1" href="/news">
          Подробнее
          <ChevronRight size={18} />
        </Link>
      </section>
      <section className="flex flex-col gap-3 md:flex-row items-center bg-white p-6 shadow-md rounded-lg">
        <div className="md:w-1/2 w-full">
          <h1 className="line-clamp-3 break-words text-left">{featuredNews?.text}</h1>
        </div>
        <div className="md:w-1/2 w-full">
          <div className="relative aspect-[4/2]">
            <CustomImage
              loading="eager"
              alt="image"
              src={featuredNews?.image}
              className="w-full h-full rounded-lg object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
