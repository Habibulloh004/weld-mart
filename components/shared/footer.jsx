"use client";

import React, { useState } from "react";
import Container from "./container";
import { MailPlus } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { socialMedias } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { postData } from "@/actions/post";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Footer() {
  const { auth } = useAuth();
  const [loading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendEmail = async () => {
    if (!email) {
      setError("Введите адрес электронной почты");
      return;
    }
    if (!validateEmail(email)) {
      setError("Введите корректный адрес электронной почты");
      return;
    }
    setError("");
    try {
      setIsLoading(true);
      let rassilkaData = {
        email,
      };
      if (auth) {
        rassilkaData.user_id = auth.id;
      }
      const res = await postData(rassilkaData, "/api/rassikas", "rassilka");

      if (res) {
        toast.success("E-mail успешно отправлен!");
        setEmail("");
      }
    } catch (error) {
      toast.error("Ошибка при отправке");
    } finally {
      setIsLoading(false);
    }
  };

  const pathname = usePathname();
  if (
    pathname.startsWith("/register") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <footer className="relative bg-thin w-full pt-36 md:pt-24 mt-36 md:mt-32 font-montserrat">
      <Container
        className={"w-10/12 justify-center items-center flex-col gap-5"}
      >
        <section className="max-w-2xl max-md:flex-col p-5 md:p-3 w-11/12 sm:w-[70%] bg-primary rounded-xl md:rounded-md absolute min-h-32 flex gap-3 -top-24 md:-top-16 left-auto right-auto">
          <h1 className="textNormal4 text-white font-bold max-sm:text-center">
            НЕ ПРОПУСТИТЕ НАШИ ПОСЛЕДНИЕ НОВОСТИ И ПРЕДЛОЖЕНИЯ
          </h1>
          <div className="space-y-3 text-black/70 w-full">
            <div className="rounded-xl bg-white justify-start flex items-center p-2 h-10 gap-2">
              <MailPlus size={20} className="text-black/70" />
              <input
                type="email"
                className="w-full outline-none"
                placeholder="Введите ваш e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-red-100 text-sm">{error}</p>}
            <Button
              onClick={handleSendEmail}
              type="submit"
              className="rounded-xl p-2 w-full bg-white hover:bg-white text-black/70"
              disabled={loading}
            >
              {loading ? "Загрузка..." : "Подписаться"}
            </Button>
          </div>
        </section>
        <section className="w-full grid grid-cols-2 lg:flex justify-between items-start gap-5">
          <div className="max-md:col-span-2 flex flex-col w-full gap-3 max-md:mb-10">
            <Image
              width={100}
              height={200}
              className="w-[200px]"
              alt="logo"
              src="/logo.svg"
              loading="eager"
            />
            <p className="hidden">Слоган Слоган Слоган Слоган Слоган Слоган Слоган</p>
          </div>
          <div className="max-sm:col-span-2 w-full lg:flex justify-center items-center flex-col space-y-3">
            <h1>СТРАНИЦЫ</h1>
            <ul className="space-y-1">
              <li>
                <Link href="/" className="text-black/70">
                  Главная
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-black/70">
                  Новости
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-black/70">
                  Контакт
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="text-black/70">
                  О нас
                </Link>
              </li>
            </ul>
          </div>
          <div className="max-sm:col-span-2 w-full lg:flex justify-end items-end lg:text-end flex-col space-y-3">
            <h1 className="">ПОДДЕРЖКА</h1>
            <ul className="space-y-1">
              <li>
                <Link href="/privacy-policy" className="text-black/70">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>
        </section>
        <div className="w-full h-[1px] bg-black/30" />
        <section className="flex max-sm:flex-col justify-between items-center w-full pb-5 gap-4">
          <h1 className="w-full font-medium text-black/40 max-sm:text-center">
            weldmart © 2025, Все права защищены
          </h1>
          <div className="w-full mx-auto flex justify-center sm:justify-end gap-4 items-end">
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
        </section>
      </Container>
    </footer>
  );
}
