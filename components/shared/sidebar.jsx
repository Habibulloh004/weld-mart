"use client";
import emblaCarouselAutoplay from "embla-carousel-autoplay";
import React, { useState, useEffect } from "react";
import { ChevronDown, Star } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn, fixImageUrl, socialMedias, truncateText } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import CustomImage from "./customImage";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar({
  className,
  handleClose = () => {},
  categoriesData,
  brandsData,
  product_type,
  id,
  sidebarBottom = false,
  allProducts = [],
  socials = false,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { showPrice } = useAuth();
  // Initialize defaultValue based on initial pathname
  const getInitialDefaultValue = () => {
    if (
      pathname.startsWith("/category/") ||
      pathname.startsWith("/podCategory/")
    ) {
      return ["catalog"];
    } else if (pathname.startsWith("/brand/")) {
      return ["brands"];
    }
    return [];
  };

  const [activeCategory, setActiveCategory] = useState(() => {
    if (pathname.startsWith("/category/")) {
      return pathname.split("/category/")[1];
    } else if (pathname.startsWith("/podCategory/")) {
      return pathname.split("/podCategory/")[1];
    } else if (pathname.startsWith("/brand/")) {
      return pathname.split("/brand/")[1];
    }
    return null;
  });
  const [defaultValue, setDefaultValue] = useState(getInitialDefaultValue);

  // Randomly select 4 products with unique brand_ids
  const featuredProducts = (() => {
    if (allProducts?.length > 0) {
      let productsCopy = [...allProducts];
      productsCopy = productsCopy.filter((pr) => pr?.rating == 5);
      const selectedProducts = [];
      const usedBrandIds = new Set();

      while (selectedProducts.length < 4 && productsCopy.length > 0) {
        const randomIndex = Math.floor(Math.random() * productsCopy.length);
        const product = productsCopy[randomIndex];

        if (!usedBrandIds.has(product.brand_id)) {
          selectedProducts.push(product);
          usedBrandIds.add(product.brand_id);
        }

        productsCopy.splice(randomIndex, 1);
      }

      return selectedProducts;
    } else {
      return [];
    }
  })();

  useEffect(() => {
    const isCategoryPage = pathname.startsWith("/category/");
    const isPodCategoryPage = pathname.startsWith("/podCategory/");
    const isBrandPage = pathname.startsWith("/brand/");

    if (isCategoryPage) {
      const currentSlug = pathname.split("/category/")[1];
      setActiveCategory(currentSlug);
      if (!defaultValue.includes("catalog")) {
        setDefaultValue(["catalog"]);
      }
    } else if (isPodCategoryPage) {
      const currentPodSlug = pathname.split("/podCategory/")[1];
      setActiveCategory(currentPodSlug);
      if (!defaultValue.includes("catalog")) {
        setDefaultValue(["catalog"]);
      }
    } else if (isBrandPage) {
      const currentBrandSlug = pathname.split("/brand/")[1];
      setActiveCategory(currentBrandSlug);
      if (!defaultValue.includes("brands")) {
        setDefaultValue(["brands"]);
      }
    } else {
      setActiveCategory(null);
      setDefaultValue([]);
    }
  }, [pathname]);

  return (
    <aside
      className={cn(
        "max-lg:hidden flex-col gap-4 font-montserrat lg:border-2 rounded-md no-scrollbar sticky top-[112px] w-[300px] max-h-[calc(100vh-112px)] overflow-y-auto",
        className
      )}
    >
      <main className="w-full p-2 z-20">
        <Accordion
          type="multiple"
          collapsible="true"
          className="w-full"
          value={defaultValue}
          onValueChange={setDefaultValue}
        >
          <AccordionItem
            onClick={() => {
              handleClose();
              router.push("/");
            }}
            value="category-home"
            className="cursor-pointer border-b-[1px] py-2 hover:text-primary"
          >
            <Link href="/" className="px-2 font-medium">
              Главная страница
            </Link>
          </AccordionItem>

          {/* Каталог Accordion */}
          <AccordionItem value="catalog" className="border-none">
            <AccordionTrigger className="pl-2 textSmall4 font-medium">
              Каталог
            </AccordionTrigger>
            <AccordionContent
              className={`relative data-[open=open]:animate-accordion-down`}
            >
              <main className="pl-4 flex flex-col gap-2">
                {categoriesData?.map((category, idx) => {
                  const isCategoryActive =
                    category.id == (activeCategory || id) &&
                    product_type === "category";
                  const isPodCategoryActive = category.bottom_categories?.some(
                    (sub) =>
                      sub.id == (activeCategory || id) &&
                      product_type === "podCategory"
                  );

                  return (
                    <Accordion
                      key={idx}
                      type="single"
                      collapsible="true"
                      className="w-full"
                      value={
                        isCategoryActive || isPodCategoryActive
                          ? `category-${category.id}`
                          : undefined
                      }
                    >
                      <AccordionItem
                        value={`category-${category.id}`}
                        className="border-none"
                      >
                        <AccordionTrigger
                          className={cn(
                            "pl-2 py-2 hover:text-primary font-medium flex justify-between items-center w-full transition-all duration-150 ease-linear",
                            isCategoryActive && "text-primary font-bold"
                          )}
                          onClick={() => {
                            setActiveCategory(category.id);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <Image
                              src={fixImageUrl(category.image)}
                              width={50}
                              loading="eager"
                              height={50}
                              alt={category.name}
                            />
                            {category.name}
                          </div>
                        </AccordionTrigger>
                        {category.bottom_categories?.length > 0 && (
                          <AccordionContent className="pl-8">
                            <div className="flex flex-col gap-2">
                              {category.bottom_categories.map((subCategory) => (
                                <Link
                                  key={subCategory.id}
                                  href={`/podCategory/${subCategory.id}`}
                                  onClick={handleClose}
                                  className={cn(
                                    "flex justify-start gap-2 items-center hover:text-primary transition-all duration-150 ease-linear border-b-[1px] py-3",
                                    subCategory.id == (activeCategory || id) &&
                                      product_type === "podCategory" &&
                                      "text-primary font-bold"
                                  )}
                                >
                                  <Image
                                    src={fixImageUrl(subCategory?.image)}
                                    width={50}
                                    loading="eager"
                                    height={50}
                                    alt={subCategory.name}
                                  />
                                  {subCategory.name}
                                </Link>
                              ))}
                            </div>
                          </AccordionContent>
                        )}
                      </AccordionItem>
                    </Accordion>
                  );
                })}
              </main>
            </AccordionContent>
          </AccordionItem>

          {/* Производитель (Brands) Accordion */}
          <AccordionItem value="brands" className="border-none">
            <AccordionTrigger className="pl-2 textSmall4 font-medium">
              Производитель
            </AccordionTrigger>
            <AccordionContent className="relative">
              <main className="pl-4 flex flex-col gap-2">
                {brandsData?.map((brand, idx) => {
                  const isBrandActive =
                    brand.id == (activeCategory || id) &&
                    product_type === "brand";

                  return (
                    <Link
                      href={`/brand/${brand?.id}`}
                      key={idx}
                      onClick={() => {
                        handleClose();
                        setActiveCategory(brand.id);
                      }}
                      className={cn(
                        "w-full flex justify-start items-center gap-1 border-b-[1px] py-2 transition-all duration-150 ease-linear hover:text-primary",
                        isBrandActive && "text-primary font-bold"
                      )}
                    >
                      <Image
                        loading="eager"
                        src={fixImageUrl(brand.image)}
                        width={50}
                        height={50}
                        alt={brand.name}
                      />
                      {brand.name}
                    </Link>
                  );
                })}
              </main>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            onClick={() => {
              handleClose();
              router.push("/news");
            }}
            value="category-news"
            className="cursor-pointer w-full border-b-[1px] py-2 hover:text-primary"
          >
            <Link href="/news" className="w-full px-2 font-medium">
              Новости
            </Link>
          </AccordionItem>
          <AccordionItem
            onClick={() => {
              handleClose();
              router.push("/contact");
            }}
            value="category-contact"
            className="cursor-pointer w-full border-b-[1px] py-2 hover:text-primary"
          >
            <Link href="/contact" className="w-full px-2 font-medium">
              Контакты
            </Link>
          </AccordionItem>
          <AccordionItem
            onClick={() => {
              handleClose();
              router.push("/about-us");
            }}
            value="category-about"
            className="cursor-pointer w-full border-b-[1px] py-2 hover:text-primary"
          >
            <Link href="/about-us" className="w-full px-2 font-medium">
              О нас
            </Link>
          </AccordionItem>
        </Accordion>
      </main>

      {sidebarBottom && featuredProducts.length > 0 && (
        <main className="p-2">
          <div className="mb-2 text-start font-medium px-2">
            Рекомендуемые продукты
          </div>
          <Carousel
            className="w-full"
            plugins={[
              emblaCarouselAutoplay({
                delay: 3000,
              }),
            ]}
            opts={{
              loop: true,
              align: "center",
            }}
          >
            <CarouselContent>
              {featuredProducts.map((product, idx) => {
                let discountSum = null;
                if (
                  product?.discount &&
                  product?.discount != 0 &&
                  product?.discount != "-" &&
                  product?.discount > 0
                ) {
                  discountSum = product?.price * (1 - product?.discount / 100);
                }
                return (
                  <CarouselItem key={product.id || idx}>
                    <Card className="border-none">
                      <CardContent className="p-2">
                        <Link
                          href={`/category/${product?.category_id}/product/${product.id}`}
                          className="space-y-2"
                        >
                          <div className="relative aspect-[5/3]">
                            <CustomImage
                              src={product.images[0]}
                              alt={product.name}
                              loading="eager"
                              className="w-full h-full rounded-md object-cover"
                            />
                          </div>
                          <div className="text-center">
                            <h3 className="text-sm font-medium">
                              {truncateText(product.name, 50)}
                            </h3>
                            {showPrice && (
                              <div className="textSmall2 font-semibold flex justify-center items-center gap-2">
                                <div>
                                  <h1
                                    className={`${
                                      discountSum &&
                                      "line-through text-black/20"
                                    }`}
                                  >
                                    {product?.price.toLocaleString()} сум
                                  </h1>
                                  {discountSum && (
                                    <h1>{discountSum.toLocaleString()} сум</h1>
                                  )}
                                </div>
                                {product?.discount &&
                                  product?.discount != 0 &&
                                  product?.discount != "-" &&
                                  product?.discount > 0 && (
                                    <span className="font-medium textSmall1 px-2 text-red-500 rounded-md bg-red-100">
                                      -{product?.discount}%
                                    </span>
                                  )}
                              </div>
                            )}
                            <div className="flex justify-center gap-1 mt-1">
                              {Array(5)
                                .fill(0)
                                .map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                                  />
                                ))}
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </main>
      )}

      {socials && (
        <main>
          <div className="w-full mx-auto flex justify-between px-4 sm:justify-end gap-4 items-end">
            {socialMedias?.map((social, idx) => (
              <Link key={idx} target="_blank" href={social.url} className="">
                <Image
                  width={100}
                  height={100}
                  src={social.icon}
                  alt={social.name}
                  className="w-8 h-8"
                />
              </Link>
            ))}
          </div>
        </main>
      )}
    </aside>
  );
}
