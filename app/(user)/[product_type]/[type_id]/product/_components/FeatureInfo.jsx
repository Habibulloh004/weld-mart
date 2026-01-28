"use client";

import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DOMPurify from "dompurify";

export default function FeatureInfo({ productData }) {
  const sanitizedInfo = useMemo(() => {
    if (typeof window === "undefined") return productData?.info || "Нет информации";
    return DOMPurify.sanitize(productData?.info || "Нет информации");
  }, [productData?.info]);

  const sanitizedFeature = useMemo(() => {
    if (typeof window === "undefined") return productData?.feature || "Нет информации";
    return DOMPurify.sanitize(productData?.feature || "Нет информации");
  }, [productData?.feature]);

  return (
    <Tabs defaultValue="info" className="w-11/12 mx-auto">
      <TabsList className="w-full">
        <TabsTrigger className="w-full textSmall3" value="info">
          Описание
        </TabsTrigger>
        <TabsTrigger className="w-full textSmall3" value="feature">
          Характеристики
        </TabsTrigger>
        <TabsTrigger className="w-full textSmall3" value="parametr">
          Гарантия
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <div dangerouslySetInnerHTML={{ __html: sanitizedInfo }} />
      </TabsContent>

      <TabsContent value="feature">
        <div dangerouslySetInnerHTML={{ __html: sanitizedFeature }} />
      </TabsContent>

      <TabsContent value="parametr">
        {productData?.guarantee || "Нет информации"}
      </TabsContent>
    </Tabs>
  );
}
