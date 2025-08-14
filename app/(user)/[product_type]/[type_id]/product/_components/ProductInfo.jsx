"use client";

import CustomImage from "@/components/shared/customImage";
import { Button } from "@/components/ui/button";
import { cn, fixImageUrl } from "@/lib/utils";
import { useProductStore } from "@/store";
import { Minus, Phone, Plus, Star, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ProductInfo({ productData }) {
  const { showPrice } = useAuth();
  const [mainImage, setMainImage] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isScaled, setIsScaled] = useState(false);
  const { products, setProducts, incrementCount, decrementCount } =
    useProductStore();

  useEffect(() => {
    if (productData?.images?.length > 0) {
      setMainImage({ image: productData.images[0], index: 0 });
    } else {
      setMainImage({ image: "/product.svg", index: 0 });
    }
  }, [productData]);

  if (!productData) {
    return (
      <div className="text-center py-10">Загрузка данных о продукте...</div>
    );
  }

  const {
    images = [],
    name = "Безымянный продукт",
    description = "Описание отсутствует",
    price = 0,
    rating = 0,
    brand,
    quantity = 0,
    discount,
  } = productData;

  const findProduct = products.find((pr) => pr.id === productData?.id);

  const truncatedLength = 200;
  const isLongDescription = description.length > truncatedLength;
  const truncatedDescription = isLongDescription
    ? `${description.slice(0, truncatedLength)}...`
    : description;

  const handleAddToCart = () => {
    if (findProduct && findProduct.count >= quantity) {
      toast.error("Этот продукт закончился!");
      return;
    }
    setProducts(productData);
  };

  const handleIncrement = () => {
    if (findProduct?.count >= quantity) {
      toast.error("Продукта недостаточно!");
      return;
    }
    incrementCount(productData.id);
  };

  const handleDecrement = () => {
    if (findProduct?.count > 0) {
      decrementCount(productData.id);
    }
  };

  let discountSum = null;
  if (discount && discount != 0 && discount > 0) {
    discountSum = price * (1 - discount / 100);
  }

  const handleImageClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!isScaled) {
      setZoomPosition({ x, y });
      setIsScaled(true);
    } else {
      setIsScaled(false);
      setZoomPosition({ x: 50, y: 50 });
    }
  };

  const handleModalChange = (open) => {
    setIsOpen(open);
    setIsScaled(false);
    setZoomPosition({ x: 50, y: 50 });
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  };

  return (
    <section className="w-11/12 mx-auto flex flex-col md:flex-row gap-6 mb-12">
      {/* Image Section */}
      <div className="w-full flex max-sm:flex-col-reverse gap-4">
        <div className="w-full flex flex-row sm:flex-col gap-4 sm:w-1/4">
          {images.length > 0 ? (
            images.map((image, index) => (
              <div
                key={index}
                onClick={() => setMainImage({ image, index })}
                className={cn(
                  "max-sm:max-w-24 w-full md:w-24 aspect-square overflow-hidden relative object-contain cursor-pointer rounded-md border",
                  mainImage?.index === index &&
                    "border-primary ring-2 ring-primary/20"
                )}
              >
                <CustomImage
                  width={100}
                  height={100}
                  src={image || "/fallback-image.jpg"}
                  alt={`Миниатюра ${index + 1}`}
                  className="object-contain aspect-square w-full h-full"
                />
              </div>
            ))
          ) : (
            <div className="w-full h-24 bg-gray-200 rounded-md flex items-center justify-center">
              Нет изображений
            </div>
          )}
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div className="w-full relative overflow-hidden h-[250px] sm:h-[400px] rounded-md cursor-pointer">
              <CustomImage
                width={500}
                height={400}
                src={mainImage?.image || "/product.svg"}
                alt={`${name} - Главное изображение`}
                className="object-contain w-full h-full rounded-md transition-opacity"
                loading="eager"
                priority
              />
            </div>
          </DialogTrigger>
          <DialogContent className="p-0 ring-0 border-0 shadow-none w-full h-full bg-transparent">
            <DialogHeader>
              <DialogTitle className="hidden">заголовок</DialogTitle>
              <DialogDescription className="hidden">описание</DialogDescription>
            </DialogHeader>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-[80vh] overflow-hidden cursor-pointer"
                  onClick={handleImageClick}
                >
                  <Image
                    width={1200}
                    height={800}
                    src={fixImageUrl(mainImage?.image) || "/product.svg"}
                    alt={`${name} - Увеличенное изображение`}
                    className="w-full h-full object-contain transition-transform duration-300 ease-in-out"
                    style={{
                      transform: isScaled ? "scale(1.3)" : "scale(1)",
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }}
                    priority
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-800 text-white rounded-full p-2"
              onClick={() => handleModalChange(false)}
            >
              <X size={24} />
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product Details */}
      <div className="w-full flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{name}</h1>
        <div className="flex justify-start items-start gap-4 flex-col">
          <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-5 h-5",
                  i < Math.floor(rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
          </div>
          {showPrice && (
            <div className="text-2xl font-semibold flex justify-start items-center gap-2">
              <div>
                <h1
                  className={`${discountSum && "line-through text-black/20"}`}
                >
                  {price.toLocaleString()} сум
                </h1>
                {discountSum && <h1>{discountSum.toLocaleString()} сум</h1>}
              </div>
              {discount && discount != 0 && discount > 0 && (
                <span className="font-medium textSmall3 px-2 text-red-500 rounded-md bg-red-100">
                  -{discount}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <p className="text-gray-600">
            {showFullDescription || !isLongDescription
              ? description
              : truncatedDescription}
          </p>
          {isLongDescription && (
            <button
              className="text-primary hover:underline mt-2"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {showFullDescription ? "Скрыть" : "Показать больше"}
            </button>
          )}
        </div>

        <div className="h-[1px] w-full bg-thin" />

        {/* Brand Info */}
        <div className="w-full flex textSmall3 gap-4">
          <h1 className="w-full sm:w-1/3 textNormall3">Бренд</h1>
          <span className="w-full sm:w-2/3 font-bold">
            {brand?.name ? brand?.name : "-"}
          </span>
        </div>
        <div className="w-full flex gap-4 textSmall3">
          <h1 className="w-full sm:w-1/3 textNormall3">Произведено</h1>
          <span className="w-full sm:w-2/3 font-bold">
            {brand?.country ? brand?.country : "-"}
          </span>
        </div>

        <div className="h-[1px] w-full bg-thin" />
        {quantity == 0 && (
          <div className="w-full flex gap-4 textSmall3">
            <h1 className="w-full sm:w-1/3 font-bold textNormall3 text-red-400">
              Нет в наличии
            </h1>
          </div>
        )}

        {/* Add to Cart & Quantity Control */}
        {showPrice ? (
          <div className="flex w-full items-center gap-2">
            <button
              onClick={handleAddToCart}
              className="textSmall3 w-full bg-primary text-white py-3 sm:py-2 md:px-6 rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={quantity === 0 || !quantity}
            >
              Добавить в корзину
            </button>

            {findProduct?.count > 0 && (
              <div className="flex gap-3 items-center bg-thin border rounded-md px-2 py-1">
                <Button
                  onClick={handleDecrement}
                  variant="outline"
                  className="p-2 h-auto bg-thin border-none"
                >
                  <Minus />
                </Button>
                <span className="textNormal3 w-10 text-center font-medium">
                  {findProduct?.count}
                </span>
                <Button
                  onClick={handleIncrement}
                  variant="outline"
                  className="p-2 h-auto bg-thin border-none"
                >
                  <Plus size={16} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href={"tel:+998954189999"}
            target="_blank"
            className="flex w-full items-center gap-2"
          >
            <button className="flex justify-center items-center gap-4 textSmall3 w-full bg-primary text-white py-3 sm:py-2 md:px-6 rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              <Phone className="text-white" size={24} />
              Контакт
            </button>
          </Link>
        )}
      </div>
    </section>
  );
}
