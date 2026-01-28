"use client";

import React, { useState } from "react";
import { Form } from "../ui/form";
import CustomFormField, { FormFieldType } from "../shared/customFormField";
import SubmitButton from "../shared/submitButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { UpdateRegisterValidation } from "@/lib/validation";
import { ArrowUpRight } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { postData } from "@/actions/post";
import Cookies from "js-cookie";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterForm() {
  const RegisterValidation = UpdateRegisterValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(RegisterValidation),
    defaultValues: {
      phone: "",
      password: "",
      name: "",
      privacy_policy: false,
    },
  });

  const { login } = useAuth();

  const onSubmit = async (values) => {
    if (!values.privacy_policy) {
      return toast.error(
        "Пожалуйста, согласитесь с условиями использования!!!"
      );
    }
    setIsLoading(true);
    try {
      const { privacy_policy, ...registerData } = values;
      const data = { ...registerData, bonus: 0, rassika_id: 0 };

      const response = await postData(data, "/api/users", "user");
      if (response.error) {
        return toast.error(response.error);
      } else if (response?.phone) {
        login(response);
        toast.success("Вы зарегистрированы!");
        form.reset();
      }
    } catch (error) {
      toast.error("Ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-5 sm:space-y-4 rounded-md"
      >
        <div className="w-full flex flex-col gap-3 lg:gap-6">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            label="Имя"
            name="name"
            placeholder=""
            inputClass="rounded-md border-[2px]"
          />
          <CustomFormField
            fieldType={FormFieldType.PHONE_INPUT}
            control={form.control}
            label="Номер телефона"
            name="phone"
            placeholder=""
            inputClass="rounded-md border-[1px]"
          />
          <CustomFormField
            label="Пароль"
            fieldType={FormFieldType.PASSWORDINPUT}
            control={form.control}
            name="password"
            placeholder=""
            inputClass="rounded-md border-[2px]"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              onCheckedChange={() =>
                form.setValue(
                  "privacy_policy",
                  !form.getValues("privacy_policy")
                )
              }
            />
            <h1
              className="text-white textSmall2 cursor-pointer"
              onClick={() => setIsDialogOpen(true)}
            >
              Создавая аккаунт, я соглашаюсь с{" "}
              <span className="underline">Условиями использования</span> и
              Политикой конфиденциальности
            </h1>
          </div>
        </div>
        <div className="flex w-full max-sm:flex-col items-center sm:justify-start gap-3 sm:items-center">
          <SubmitButton
            isLoading={isLoading}
            className="w-full sm:w-40 bg-white hover:bg-white text-black"
          >
            Отправить
          </SubmitButton>
          <div className="sm:hidden w-full text-white flex items-center justify-center gap-2">
            <div className="w-full h-[1.5px] bg-white" />
            <h1 className="textNormal3">Или</h1>
            <div className="w-full h-[1.5px] bg-white" />
          </div>
          <div>
            <h1 className="max-sm:hidden text-[13px] text-white font-[400]">
              У вас уже есть аккаунт?
              <Link href={`/login`} className="hover:underline font-bold ">
                {" Войти"}
              </Link>
            </h1>
          </div>
          <Link
            href={`/register`}
            className="hover:underline sm:hidden flex justify-center items-center gap-2 text-white"
          >
            <h1 className="">Войти</h1>
            <ArrowUpRight />
          </Link>
        </div>
      </form>

      {/* ShadCN Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-auto rounded-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="hidden">Фойдаланиш шартлари</DialogTitle>
            <DialogDescription className="hidden">dfasf</DialogDescription>
          </DialogHeader>
          <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-3xl font-bold text-center mb-6">
              Условия пользования сайтом и Политика конфиденциальности
            </h1>
            <p className="text-gray-700 mb-4">
              Добро пожаловать на сайт{" "}
              <span className="font-semibold">WELDMART</span>. Пожалуйста,
              внимательно ознакомьтесь с настоящими Условиями.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
              1. Регистрация и заказ
            </h2>
            <p className="text-gray-700">
              Для оформления заказа на нашем сайте необходимо зарегистрироваться
              и указать актуальную информацию, включая имя, контактные данные и
              адрес доставки.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
              2. Оплата и доставка
            </h2>
            <p className="text-gray-700">
              2.1. Мы предлагаем несколько простых способов оплаты: банковские
              карты, электронные кошельки и другие доступные методы, доступные
              на сайте. Все платежи осуществляются в узбекских суммах (UZS) или
              другой валюте.
            </p>
            <p className="text-gray-700">
              2.2. Стоимость доставки зависит от вашего местоположения и способа
              доставки. Точные условия будут указаны при оформлении заказа. Мы
              доставляем товары по всей территории Узбекистана.
            </p>
            <p className="text-gray-700">
              2.3. Ожидаемый срок доставки зависит от региона и наличия товара
              на складе. Мы делаем все возможное, чтобы ваша покупка была
              совершена в кратчайшие сроки.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
              3. Ответственность
            </h2>
            <p className="text-gray-700">
              Мы гарантируем качество товара, а в случае несоответствия или
              брака товар будет заменен или возвращен.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
              4. Интеллектуальная собственность
            </h2>
            <p className="text-gray-700">
              Все материалы, размещенные на сайте (включая текст, изображения,
              логотипы, видео, графику и другие элементы), являются
              интеллектуальной собственностью ООО “WELDMART” и защищены законом
              Республики Узбекистан об авторском праве.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
              5. Применимое законодательство
            </h2>
            <p className="text-gray-700">
              Настоящие Условия регулируются требованиями Республики Узбекистан.
              В случае возникновения споров они будут разрешены в судебном
              порядке в соответствии с законодательством Республики Узбекистан.
            </p>

            <p className="text-center text-gray-700 font-semibold mt-6">
              Спасибо, что выбрали нас! Мы желаем вам удачных покупок, отличного
              настроения и качественного обслуживания!
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
            Отмена
            </Button>
            <Button className="hover:bg-primary" onClick={() => setIsDialogOpen(false)}>ОК</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
