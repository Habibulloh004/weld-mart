// components/news/NewsGrid.jsx
"use client";

import React from "react";
import NewsCard from "@/components/shared/news-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { fixImageUrl } from "@/lib/utils";

export default function NewsGrid({ newsItems }) {
  return (
    <section className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
      {newsItems.map((item, i) => (
        <Dialog key={i}>
          <DialogTrigger asChild>
            <button className="relative mt-1 text-left w-full">
              <NewsCard news={item} />
            </button>
          </DialogTrigger>
           <DialogContent mark="false" className="w-11/12 sm:max-w-[625px] rounded-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Новости
                <span className="text-sm text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative w-full h-64">
                <Image
                  src={fixImageUrl(item.image)}
                  alt="изображение новости"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <DialogDescription className="text-gray-700">
                {item.text}
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </section>
  );
}
