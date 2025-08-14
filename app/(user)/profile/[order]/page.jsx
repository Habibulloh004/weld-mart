import { getData } from "@/actions/get";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BreadcrumbComponent from "@/components/shared/BreadcrumbComponent";
import { fixImageUrl } from "@/lib/utils";

export default async function OrderPage({ params }) {
  const orderId = params?.order;
  if (!orderId) return <div>Заказ не найден</div>;

  const [orderData] = await Promise.all([
    getData(`/api/orders/${orderId}`, "order"),
  ]);

  if (!orderData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-600">Заказ не найден</h2>
        <Link
          href="/admin/orders"
          className="mt-4 text-blue-500 flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Вернуться назад
        </Link>
      </div>
    );
  }

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
    order_items,
    status, // Предполагается, что статус есть в данных заказа
  } = orderData;

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

  return (
    <div className="w-11/12 mx-auto">
      {/* Кнопка возврата */}
      <BreadcrumbComponent
        data={[
          {
            href: "/",
            name: "Главная страница",
          },
          {
            name: "Профиль",
            href: "/profile",
          },
          {
            name: `Заказ #${orderId}`,
            href: `/profile/${orderId}`,
          },
        ]}
      />

      {/* Карточка с общей информацией о заказе */}
      <Card className="mb-8 pt-6">
        <CardHeader className="p-0">
          <CardTitle className="text-2xl md:text-3xl font-bold p-0">
            Заказ #{orderId} -{" "}
            {order_type === "individual"
              ? "Физическое лицо"
              : "Юридическое лицо"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-0">
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
              {price.toLocaleString()} сум
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Бонус</p>
            <p className="text-lg font-semibold">
              {bonus.toLocaleString()} сум
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Статус</p>
            <p className="text-lg font-semibold">{getStatusDisplay(status)}</p>
          </div>
          <div className="col-span-full">
            <p className="text-sm text-gray-500">Комментарий</p>
            <p className="text-lg">{comment || "Комментария нет"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Таблица товаров заказа */}
      <Card>
        <CardHeader className="p-0">
          <CardTitle className="text-2xl font-bold">Товары заказа</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                const productImage = item.product?.image || "/product.svg";
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Image
                        src={fixImageUrl(productImage)}
                        alt={item?.name || `Товар #${item.product_id}`}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item?.name}</TableCell>
                    <TableCell>{item.order_quantity}</TableCell>
                    <TableCell>{item?.price.toLocaleString()} сум</TableCell>
                    <TableCell>
                      {(item?.price * item?.order_quantity).toLocaleString()}{" "}
                      сум
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
