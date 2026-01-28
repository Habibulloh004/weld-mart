"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  CircleUserRound,
  HamIcon,
  Menu,
  Phone,
  Search,
  ShoppingCart,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Marquee from "../ui/marquee";
import Container from "./container";
import { Button } from "../ui/button";
import SearchComponent from "./search-component";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Sidebar from "./sidebar";
import { useAuth } from "@/context/AuthContext";
import { useOrderStore, useProductStore } from "@/store";

export default function Header({ categoriesData, brandsData }) {
  const { auth, showPrice } = useAuth(); // Получение auth из контекста
  const { products, initializeProducts } = useProductStore();
  const { initializeOrderData } = useOrderStore();

  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    initializeProducts();
    initializeOrderData();
  }, []);
  if (pathname.startsWith("/admin") || pathname.startsWith("/login-admin")) {
    return;
  }
  return (
    <header className="shadow-sm sticky top-0 left-0 w-full bg-white z-[999] mb-1">
      {!auth && (
        <>
          <div className="hidden w-full h-8 text-white bg-primary sm:flex justify-center gap-1 items-center font-montserrat">
            Скидка 5% на доставку.
            <Link className="font-medium hover:underline" href={"/"}>
              Закажите прямо сейчас
            </Link>{" "}
          </div>
          <Marquee
            pauseOnHover
            className="sm:hidden [--duration:10s] w-full h-8 text-white bg-primary flex justify-center gap-1 items-center font-montserrat"
          >
            <div className="w-full h-8 text-white bg-primary flex justify-center gap-1 items-center font-montserrat">
              Скидка 5% на доставку.
              <Link className="font-medium hover:underline" href={"/"}>
                Закажите прямо сейчас
              </Link>{" "}
            </div>
          </Marquee>
        </>
      )}
      {!(
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/register")
      ) && (
        <Container className="mx-auto h-20 w-11/12 lg:w-10/12 flex justify-between items-center gap-7 pt-0">
          <div className="w-full flex justify-start items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Menu size={32} className="lg:hidden" />
              </SheetTrigger>
              <SheetContent side="left" className="w-full">
                <SheetHeader className={"hidden"}>
                  <SheetTitle>Вы абсолютно уверены?</SheetTitle>
                  <SheetDescription>
                    Это действие нельзя отменить. Это навсегда удалит ваш
                    аккаунт и удалит ваши данные с наших серверов.
                  </SheetDescription>
                </SheetHeader>
                <main className="flex justify-start items-center flex-col">
                  <Link href="/" className="w-full">
                    <Image
                      width={150}
                      height={100}
                      alt="логотип"
                      src={"/logo.svg"}
                      loading="eager"
                      className=""
                    />
                  </Link>
                  <Sidebar
                    socials={true}
                    handleClose={() => setOpen(false)}
                    className={
                      "max-lg:flex font-montserrat lg:border-2 rounded-md no-scrollbar sticky top-[112px] w-full max-h-[calc(100vh-116px)] overflow-auto"
                    }
                    categoriesData={categoriesData?.categories}
                    product_type={
                      pathname.startsWith("/podCategory")
                        ? "podCategory"
                        : pathname.startsWith("/brand")
                        ? "brand"
                        : pathname.startsWith("/category")
                        ? "category"
                        : null
                    }
                    brandsData={brandsData?.brands}
                    id={pathname.split("/")[2] ? pathname.split("/")[2] : null}
                  />
                </main>
              </SheetContent>
            </Sheet>

            <Link href="/" className="">
              <Image
                width={100}
                height={100}
                className="w-[150px]"
                alt="логотип"
                src="/logo.svg"
                loading="eager"
              />
            </Link>
          </div>
          <SearchComponent variant="desktop" />
          {/* Ссылки для десктопа */}
          <div className="flex gap-5 max-md:hidden">
            {showPrice ? (
              <Link href="/cart">
                <ShoppingCart className="text-black" size={32} />
                {products.length > 0 && (
                  <div className="relative">
                    <span className="text-white textSmall3 absolute -top-10 -right-3 size-5 md:size-6 rounded-full bg-primary flex items-center justify-center">
                      {products?.length}
                    </span>
                  </div>
                )}
              </Link>
            ) : (
              <Link className="flex justify-center items-center" target="_blank" href="tel:+998954189999">
                <Phone className="text-black" size={28} />
              </Link>
            )}
            {auth?.phone ? (
              <Link href="/profile">
                <CircleUserRound size={32} className="text-black" />
              </Link>
            ) : (
              <Link href="/login">
                <Button className="hover:bg-primary hover:opacity-75">
                  Войти
                </Button>
              </Link>
            )}
          </div>
          {/* Ссылки для мобильных устройств */}
          <div className="flex gap-5 md:hidden">
            <SearchComponent variant="mobile" />

            {showPrice ? (
              <Link href="/cart">
                <ShoppingCart className="text-black" size={28} />
                {products.length > 0 && (
                  <div className="relative">
                    <span className="text-white textSmall3 absolute -top-10 -right-3 size-5 md:size-6 rounded-full bg-primary flex items-center justify-center">
                      {products?.length}
                    </span>
                  </div>
                )}
              </Link>
            ) : (
              <Link className="flex justify-center items-center" target="_blank" href="tel:+998954189999">
                <Phone className="text-black" size={24} />
              </Link>
            )}
            {auth?.phone ? (
              <Link href="/profile">
                <CircleUserRound size={28} className="text-black" />
              </Link>
            ) : (
              <Link href="/login">
                <Button className="hover:bg-primary hover:opacity-75">
                  Войти
                </Button>
              </Link>
            )}
          </div>
        </Container>
      )}
    </header>
  );
}
