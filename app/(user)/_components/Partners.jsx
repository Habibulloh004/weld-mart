"use client";

import { Marquee } from "@/components/magicui/marquee";
import { fixImageUrl } from "@/lib/utils";
import Image from "next/image";

export default function Partners({ partners }) {
  const partnersData = partners;
  return (
    <main className="space-y-2">
      <section>
        <h1 className="textNormal4 font-medium max-md:w-11/12 mx-auto">Наши клиенты</h1>
      </section>
      <Marquee pauseOnHover className="[--duration:120s]">
        {partnersData?.map((card, index) => (
          <div key={index} className="relative w-full h-full border rounded-xl p-2">
            <Image
              src={fixImageUrl(card?.image)}
              alt="image"
              width={100}
              height={100}
              className="grayscale hover:grayscale-0 translation-all duration-300 ease-linear hover:scale-125 cursor-pointer w-full h-20 md:h-18 pr-4 md:pr-12"
            />
          </div>
        ))}
      </Marquee>
    </main>
  );
}
