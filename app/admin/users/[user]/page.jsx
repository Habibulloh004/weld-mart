"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getData } from "@/actions/get";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { postData } from "@/actions/post";
import { putData } from "@/actions/put";

const formSchema = z.object({
  name: z.string().min(1, "Имя обязательно"),
  phone: z
    .string()
    .min(1, "Телефон обязателен")
    .regex(/^\+?[1-9]\d{1,14}$/, "Неверный формат номера телефона"),
  password: z.string().optional(), // Необязательно в режиме редактирования
  bonus: z.number().min(0, "Бонус не может быть отрицательным"),
});

export default function UserEvent({ params }) {
  const { user: userId } = use(params); // Динамический параметр маршрута для ID пользователя
  const router = useRouter();
  const isAddMode = userId === "add";
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      bonus: 0,
    },
  });

  // Получение данных пользователя для режима редактирования
  useEffect(() => {
    if (!isAddMode && userId !== "add") {
      const fetchUser = async () => {
        try {
          setIsLoading(true);
          const user = await getData(`/api/users/${userId}`, "user");
          if (user) {
            setOrders(user?.order);
            form.reset({
              name: user?.name || "",
              phone: user?.phone || "",
              password: "", // Не заполняем пароль для безопасности
              bonus: user?.bonus || 0,
            });
          }
        } catch (error) {
          console.error("Не удалось загрузить пользователя", error);
          toast.error("Не удалось загрузить данные пользователя.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [userId, isAddMode, form]);

  async function onSubmit(values) {
    try {
      setSubmitLoading(true);

      // Подготовка значений для отправки
      const updatedValues = { ...values };

      // В режиме добавления пароль обязателен
      if (isAddMode && !updatedValues.password) {
        toast.error("Введите пароль (обязательно)");
        setSubmitLoading(false);
        return;
      }

      // В режиме редактирования исключаем пароль, если он не указан
      if (!isAddMode && !updatedValues.password) {
        delete updatedValues.password;
      }

      let result;
      if (isAddMode) {
        result = await postData(updatedValues, "/api/users", "user");
      } else {
        result = await putData(updatedValues, `/api/users/${userId}`, "user");
      }

      if (result && !result.error) {
        if (isAddMode) {
          toast.success("Пользователь успешно добавлен");
          form.reset();
        } else {
          toast.info("Пользователь успешно обновлен");
        }
        router.push("/admin/users");
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Ошибка отправки формы:", error);
      toast.error("Форма не отправлена. Попробуйте еще раз.");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => window.history.back()}
        className="hover:bg-primary hover:opacity-75"
      >
        Вернуться назад
      </Button>
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">
          {isAddMode
            ? "Добавить нового пользователя"
            : `Редактировать пользователя (ID: ${userId || "неизвестно"})`}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите имя пользователя"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите номер телефона (например, +79876543210)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Введите в международном формате (например, +79876543210).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        isAddMode
                          ? "Введите пароль"
                          : "Введите новый пароль (необязательно)"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isAddMode
                      ? "Обязательно для новых пользователей."
                      : "Оставьте пустым, если хотите сохранить текущий пароль."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Бонус</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Введите количество бонусов"
                      step="0.01"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>{orders?.length > 0 && <div></div>}</div>

            <Button type="submit" className="w-full" disabled={submitLoading}>
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAddMode ? (
                "Добавить пользователя"
              ) : (
                "Обновить пользователя"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}