"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useOrderStore, useProductStore } from "@/store";
import { roundToTwoDecimals, wsUrl } from "@/lib/utils";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { postData } from "@/actions/post";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { putData } from "@/actions/put";

// Adjusted schema to make maxBonus inclusive
const individualSchema = (maxBonus) =>
  z.object({
    phone: z
      .string()
      .min(1, "Телефон обязателен")
      .regex(/^\+998\d{9}$/, "Неверный формат номера телефона"),
    name: z.string().min(1, "Имя обязательно"),
    comment: z.string().optional(),
    bonus: maxBonus > 0
      ? z
          .number()
          .min(0, "Бонус не может быть меньше 0")
          .max(maxBonus, {
            message: `Бонус не может превышать ${maxBonus.toLocaleString()} сум`,
          }) // Inclusive max
          .optional()
          .or(z.literal("")) // Allow empty string for optional input
      : z.number().optional().or(z.literal("")),
    service_mode: z.enum(["delivery", "spot"], {
      required_error: "Выберите тип услуги",
    }),
  });

const legalSchema = (maxBonus) =>
  z.object({
    organization: z.string().min(1, "Введите название организации"),
    inn: z.string().min(1, "ИНН обязателен"),
    comment: z.string().optional(),
    bonus: maxBonus > 0
      ? z
          .number()
          .min(0, "Бонус не может быть меньше 0")
          .max(maxBonus, {
            message: `Бонус не может превышать ${maxBonus.toLocaleString()} сум`,
          }) // Inclusive max
          .optional()
          .or(z.literal("")) // Allow empty string for optional input
      : z.number().optional().or(z.literal("")),
    service_mode: z.enum(["delivery", "spot"], {
      required_error: "Выберите тип услуги",
    }),
  });

export default function TotalInfo() {
  const { auth, setAuth } = useAuth();
  const { products, resetProduct } = useProductStore();
  const { totalSum, setTotalSum } = useOrderStore();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deliveryPrice = 50000;
  const maxBonus = auth?.bonus || 0;
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountingRef = useRef(false);

  const individualForm = useForm({
    resolver: zodResolver(individualSchema(maxBonus)),
    defaultValues: {
      phone: "",
      name: "",
      comment: "",
      bonus: "", // Default to empty string for optional input
      service_mode: "delivery",
    },
  });

  const legalForm = useForm({
    resolver: zodResolver(legalSchema(maxBonus)),
    defaultValues: {
      organization: "",
      inn: "",
      comment: "",
      bonus: "", // Default to empty string for optional input
      service_mode: "delivery",
    },
  });

  useEffect(() => {
    const maxReconnectAttempts = 10;
    const baseReconnectDelay = 1000;

    const scheduleReconnect = () => {
      if (isUnmountingRef.current) return;

      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.warn("Максимальное количество попыток переподключения WebSocket достигнуто");
        return;
      }

      const delay = Math.min(
        baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
        30000
      );
      reconnectAttemptsRef.current += 1;


      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isUnmountingRef.current) {
          connect();
        }
      }, delay);
    };

    const connect = () => {
      if (isUnmountingRef.current) return;

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };
      ws.onclose = (event) => {
        wsRef.current = null;
        if (event.code !== 1000 && !isUnmountingRef.current) {
          scheduleReconnect();
        }
      };
      ws.onerror = () => {};
      ws.onmessage = () => {};
    };

    isUnmountingRef.current = false;
    connect();

    return () => {
      isUnmountingRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, []);

  const calculateProductTotal = useCallback((product) => {
    if (!product || !product.price || !product.count) return 0;
    let productPrice =
      product?.discount > 0
        ? product.price * (1 - product.discount / 100)
        : product.price;
    return roundToTwoDecimals(productPrice * product.count);
  }, []);

  useEffect(() => {
    let totalSum = 0;
    products.forEach((product) => {
      const productTotal = calculateProductTotal(product);
      totalSum += productTotal;
    });
    setTotalSum(roundToTwoDecimals(totalSum));
  }, [products, calculateProductTotal, setTotalSum]);

  const sendToWebSocket = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (data.error) {
        wsRef.current.send(
          JSON.stringify({
            message: {
              order_type: "new",
              id: "new",
            },
          })
        );
      } else {
        wsRef.current.send(JSON.stringify({ message: data }));
      }
    }
  };

  const onIndividualSubmit = async (data) => {
    if (products.length === 0) {
      toast.error("Корзина пуста!");
      return;
    }
    setIsSubmitting(true);
    const deliverPrice = data.service_mode === "delivery" ? deliveryPrice : 0;
    let indivData = {
      ...data,
      bonus: data.bonus || 0, // Convert empty string to 0
      order_type: "individual",
      price: +totalSum + +deliverPrice,
      status: "new",
      order_items: products.map((pr) => ({
        product_id: pr?.id,
        quantity: pr?.count,
      })),
    };
    if (auth?.phone) {
      indivData = { ...indivData, user_id: auth?.id };
    } else {
      indivData = { ...indivData, user_id: 0 };
    }
    try {
      const res = await postData(indivData, "/api/individual-orders", "order");
      if (res.id || res.error?.includes("created")) {
        if (auth?.phone) {
          let userBonus = (+auth?.bonus || 0) + (totalSum * 5) / 100;
          setAuth({
            ...auth,
            bonus: roundToTwoDecimals(userBonus),
          });
          await putData(
            {
              ...auth,
              bonus: roundToTwoDecimals(userBonus),
            },
            `/api/users/${auth?.id}`,
            "user"
          );
        }
        toast.success("Заказ успешно создан!");
        sendToWebSocket(res);
        setOpen(false);
        individualForm.reset();
        resetProduct();
        await Promise.all([
          fetch(`/api/revalidate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: "product" }),
          }),
          fetch(`/api/revalidate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: "user" }),
          }),
        ]);
      }
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
      toast.error("Ошибка при создании заказа!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLegalSubmit = async (data) => {
    if (products.length === 0) {
      toast.error("Корзина пуста!");
      return;
    }
    setIsSubmitting(true);
    const deliverPrice = data.service_mode === "delivery" ? deliveryPrice : 0;
    let legalData = {
      ...data,
      bonus: data.bonus || 0, // Convert empty string to 0
      order_type: "legal",
      price: +totalSum,
      deliverprice: deliverPrice,
      status: "new",
      order_items: products.map((pr) => ({
        product_id: pr?.id,
        quantity: pr?.count,
      })),
    };
    if (auth?.phone) {
      legalData = { ...legalData, user_id: auth?.id };
    } else {
      legalData = { ...legalData, user_id: 0 };
    }
    try {
      const res = await postData(legalData, "/api/legal-orders", "order");
      if (res.id || res.error?.includes("created")) {
        if (auth?.phone) {
          let userBonus = (+auth?.bonus || 0) + (totalSum * 5) / 100;
          setAuth({
            ...auth,
            bonus: roundToTwoDecimals(userBonus),
          });
          await putData(
            {
              ...auth,
              bonus: roundToTwoDecimals(userBonus),
            },
            `/api/users/${auth?.id}`,
            "user"
          );
        }
        toast.success("Заказ успешно создан!");
        resetProduct();
        setOpen(false);
        legalForm.reset();
        await Promise.all([
          fetch(`/api/revalidate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: "product" }),
          }),
          fetch(`/api/revalidate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: "user" }),
          }),
        ]);
        sendToWebSocket(res);
      }
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
      toast.error("Ошибка при создании заказа!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const OrderDetails = ({ form }) => {
    const serviceMode = form.watch("service_mode");
    const bonus = form.watch("bonus") || 0; // Handle empty bonus
    const finalPrice =
      totalSum + (serviceMode === "delivery" ? deliveryPrice : 0) - bonus;

    return (
      <div key={serviceMode} className="p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">
          Детали заказа
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Количество товаров: {products.length}
          </p>
          <div>
            <p className="text-sm font-medium text-gray-700">Товары:</p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {products.map((product, index) => (
                <li key={product.id || index}>
                  {product.name || "Без названия"} - {product.count} шт
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            Общая стоимость: {totalSum.toLocaleString()} сум
          </p>
          <p className="text-sm text-gray-600">
            Доставка:{" "}
            {(serviceMode === "delivery" ? deliveryPrice : 0).toLocaleString()}{" "}
            сум
          </p>
          {bonus > 0 && (
            <p className="text-sm text-gray-600">
              Бонус: -{bonus.toLocaleString()} сум
            </p>
          )}
          <p className="font-bold text-lg text-gray-800">
            Итого: {finalPrice.toLocaleString()} сум
          </p>
        </div>
      </div>
    );
  };

  return (
    <main className="w-full lg:w-[60%] h-full border p-6 rounded-lg flex flex-col gap-5 bg-white shadow-md">
      <h1 className="text-xl font-bold text-gray-800">Ваш заказ</h1>

      <div className="flex flex-col gap-3 text-base">
        <div className="flex justify-between font-medium text-gray-700">
          <span>Итого</span>
          <span className="font-bold">{totalSum?.toLocaleString()} сум</span>
        </div>
        <div className="flex justify-between font-medium text-gray-700">
          <span>Доставка</span>
          <span>{deliveryPrice.toLocaleString()} сум</span>
        </div>
      </div>

      <div className="flex justify-between font-bold text-lg text-gray-800">
        <span>Общая сумма</span>
        <span>{(+totalSum + +deliveryPrice).toLocaleString()} сум</span>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="h-11 w-full bg-primary hover:bg-primary text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md">
              Подтвердить заказ
              <ArrowRight size={18} />
            </Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent
          mark="false"
          className="max-sm:w-11/12 w-full sm:max-w-3xl rounded-lg bg-white shadow-xl"
        >
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="text-xl font-bold text-gray-800">
                Подтверждение заказа
              </DialogTitle>
            </motion.div>
          </DialogHeader>
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
              <TabsTrigger
                value="individual"
                className="text-sm font-medium py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Физическое лицо
              </TabsTrigger>
              <TabsTrigger
                value="legal"
                className="text-sm font-medium py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Юридическое лицо
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" asChild>
              <motion.div
                key="individual"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row gap-6 mt-4"
              >
                <div className="flex-1">
                  <Form {...individualForm}>
                    <form
                      onSubmit={individualForm.handleSubmit(onIndividualSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={individualForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Телефон
                            </FormLabel>
                            <FormControl>
                              <PhoneInput
                                defaultCountry="UZ"
                                placeholder="+998 91 080 06 16"
                                international
                                withCountryCallingCode
                                value={field.value || ""}
                                onChange={field.onChange}
                                className="input-phone1 w-full p-2 border border-gray-300 rounded-md focus:border-primary focus:ring-primary"
                                countryCallingCodeEditable={false}
                                focusInputOnCountrySelection
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={individualForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Имя</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ваше имя"
                                className="border-gray-300 focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={individualForm.control}
                        name="service_mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Тип услуги
                            </FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full p-2 border border-gray-300 rounded-md focus:border-primary focus:ring-primary"
                              >
                                <option value="delivery">Доставка</option>
                                <option value="spot">Самовывоз</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {auth && maxBonus > 0 && (
                        <FormField
                          control={individualForm.control}
                          name="bonus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Бонус (Максимум: {maxBonus.toLocaleString()} сум)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Сумма бонуса"
                                  className="border-gray-300 focus:border-primary"
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      ? parseFloat(e.target.value)
                                      : "";
                                    field.onChange(value);
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={individualForm.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Комментарий (необязательно)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Комментарий"
                                className="border-gray-300 focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          className="w-full bg-primary hover:bg-primary text-white rounded-lg shadow-md"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Подтвердить"
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </Form>
                </div>
                <div className="flex-1">
                  <OrderDetails form={individualForm} />
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="legal" asChild>
              <motion.div
                key="legal"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row gap-6 mt-4"
              >
                <div className="flex-1">
                  <Form {...legalForm}>
                    <form
                      onSubmit={legalForm.handleSubmit(onLegalSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={legalForm.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Организация
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Название организации"
                                className="border-gray-300 focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={legalForm.control}
                        name="inn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">ИНН</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ИНН"
                                className="border-gray-300 focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={legalForm.control}
                        name="service_mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Тип услуги
                            </FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full p-2 border border-gray-300 rounded-md focus:border-primary focus:ring-primary"
                              >
                                <option value="delivery">Доставка</option>
                                <option value="spot">Самовывоз</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {auth && maxBonus > 0 && (
                        <FormField
                          control={legalForm.control}
                          name="bonus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Бонус (Максимум: {maxBonus.toLocaleString()} сум)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Сумма бонуса"
                                  className="border-gray-300 focus:border-primary"
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      ? parseFloat(e.target.value)
                                      : "";
                                    field.onChange(value);
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={legalForm.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Комментарий (необязательно)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Комментарий"
                                className="border-gray-300 focus:border-primary"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          className="w-full bg-primary hover:bg-primary text-white rounded-lg shadow-md"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Подтвердить"
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </Form>
                </div>
                <div className="flex-1">
                  <OrderDetails form={legalForm} />
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button className="h-11 w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-3 rounded-lg shadow-md flex items-center justify-center gap-2">
          Через{" "}
          <Image
            src="/assets/zoodpay.svg"
            alt="zoodpay"
            width={100}
            height={100}
          />
        </Button>
      </motion.div> */}
    </main>
  );
}