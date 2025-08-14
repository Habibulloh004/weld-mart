"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getData } from "@/actions/get"; // Для получения данных
import { putData } from "@/actions/put"; // Для обновления данных
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useAdminSocket } from "@/context/AdmnSocketContext";
import { fixImageUrl, roundToTwoDecimals } from "@/lib/utils";

export default function ViewOrder() {
  const router = useRouter();
  const { id } = useParams(); // Получение ID заказа из URL
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { reloadFunc } = useAdminSocket();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        let orderData = await getData(`/api/orders/${id}`, "order");
        if (!orderData) {
          throw new Error("Order not found");
        }
        setOrder(orderData);
        if (orderData?.user_id && orderData?.user_id !== 0) {
          const userData = await getData(
            `/api/users/${orderData?.user_id}`,
            "user"
          );
          setUser(userData);
        }

        // Если статус заказа "new", изменяем его на "created"
        if (orderData.status === "new") {
          const updatedOrder = { ...orderData, status: "created" };
          console.log(updatedOrder);

          const res = await putData(updatedOrder, `/api/orders/${id}`, "order");
          console.log(res);

          setOrder(updatedOrder);
          reloadFunc();
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
        toast.error("Ошибка при загрузке заказа.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleCompleteOrder = async () => {
    if (order.status === "finished") {
      toast.info("Заказ уже завершен.");
      return;
    }

    try {
      const updatedOrder = { ...order, status: "finished" };
      const res = await putData(updatedOrder, `/api/orders/${id}`, "order");
      if (res) {
        setOrder(updatedOrder);
        if (
          order?.user_id &&
          order.user_id !== 0 &&
          order?.bonus &&
          order.bonus !== 0
        ) {
          let userBonus = (+user?.bonus || 0) - +order?.bonus;
          await putData(
            {
              ...user,
              bonus: roundToTwoDecimals(userBonus),
            },
            `/api/users/${user?.id}`,
            "user"
          );
          await fetch(`/api/revalidate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: "user" }),
          });
        }
        reloadFunc();
        toast.success(`Заказ #${id} завершен!`);
      }
    } catch (error) {
      console.error("Failed to complete order:", error);
      toast.error("Ошибка при завершении заказа.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-600">Заказ не найден</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/orders")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Вернуться назад
        </Button>
      </div>
    );
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case "new":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
            Новый заказ
          </span>
        );
      case "created":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Заказ принят
          </span>
        );
      case "finished":
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Заказ завершен
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Неизвестно
          </span>
        );
    }
  };

  const {
    order_type,
    price,
    bonus,
    user_id,
    phone,
    name,
    organization,
    inn,
    comment,
    status,
    order_items,
  } = order;

  return (
    <div className="container mx-auto py-10">
      {/* Back Button */}
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push("/admin/orders")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Вернуться назад
      </Button>

      {/* Order Summary Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold">
              Заказ #{id} -{" "}
              {order_type === "individual"
                ? "Физическое лицо"
                : "Юридическое лицо"}
            </CardTitle>
            <div className="flex gap-4 items-center">
              <div
                variant={order_type === "individual" ? "default" : "secondary"}
                className="text-lg px-4 py-1"
              >
                {order_type === "individual" ? "Личный" : "Организация"}
              </div>
              <Button
                variant="success"
                className="bg-primary text-white"
                onClick={handleCompleteOrder}
                disabled={status === "finished"}
              >
                Завершить заказ
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">пользователя</p>
            <p className="text-lg font-semibold">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Статус</p>
            <p className="text-lg font-semibold">{getStatusDisplay(status)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Телефон</p>
            <p className="text-lg font-semibold">{phone || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {order_type === "individual" ? "Имя" : "Организация"}
            </p>
            <p className="text-lg font-semibold">
              {order_type === "individual" ? name : organization || "-"}
            </p>
          </div>
          {order_type === "legal" && (
            <div>
              <p className="text-sm text-gray-500">ИНН</p>
              <p className="text-lg font-semibold">{inn || "-"}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Общая стоимость</p>
            <p className="text-lg font-semibold">
              {price.toLocaleString()} сум.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Бонус</p>
            <p className="text-lg font-semibold">
              {bonus.toLocaleString()} сум.
            </p>
          </div>
          <div className="col-span-full">
            <p className="text-sm text-gray-500">Комментарий</p>
            <p className="text-lg">{comment || "Комментарий отсутствует"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Order Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Товары заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Изображение</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Итого</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order_items.map((item, idx) => {
                const product = item.product || {};
                const productName =
                  product.name || `Продукт #${item.product_id}`;
                const productImage = product.image || "/product.svg";

                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Image
                        src={fixImageUrl(productImage)}
                        alt={productName}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item?.name}</TableCell>
                    <TableCell>{item.order_quantity}</TableCell>
                    <TableCell>{item?.price.toLocaleString()} сум.</TableCell>
                    <TableCell>
                      {(item?.price * item?.order_quantity).toLocaleString()}{" "}
                      сум.
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
