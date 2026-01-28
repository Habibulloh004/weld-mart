"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox import
import Link from "next/link";
import { useEffect, useState } from "react";
import { getData } from "@/actions/get";
import { deleteData } from "@/actions/delete";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Pagination from "../_components/Pagination"; // Added Pagination component
import { useAdminSocket } from "@/context/AdmnSocketContext";

// General filter function with a single search term
const filterItems = (items, searchTerm) => {
  if (!searchTerm) return items;

  const lowerSearchTerm = searchTerm.toLowerCase();
  return items.filter((item) => {
    const fields = {
      id: item.id?.toString() || "",
      name: item.name?.toString() || "",
      phone: item.phone?.toString() || "",
      price: item.price?.toString() || "",
      order_type: item.order_type?.toString() || "",
      organization: item.organization?.toString() || "",
      created_at: new Date(item.created_at).toLocaleDateString() || "",
      updated_at: new Date(item.updated_at).toLocaleDateString() || "",
    };
    return Object.values(fields).some((value) =>
      value.toLowerCase().includes(lowerSearchTerm)
    );
  });
};

export default function Orders() {
  const router = useRouter();
  const { newOrders, reload } = useAdminSocket();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ordersToDelete, setOrdersToDelete] = useState([]); // Changed to array for multi-delete
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); // Single search term
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]); // For multi-select

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getData("/api/orders", "order");
        setOrders(response || []);
      } catch (error) {
        toast.error("Ошибка при загрузке заказов");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [newOrders, reload]);

  const itemsPerPage = 10;

  // Filter and pagination logic
  const filteredOrders = filterItems(orders.slice().reverse(), searchTerm);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (orders) => {
    setOrdersToDelete(Array.isArray(orders) ? orders : [orders]); // Handle single or multiple
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ordersToDelete.length) return;

    try {
      const deletePromises = ordersToDelete.map((order) =>
        deleteData(`/api/orders/${order.id}`, "order")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setOrders((prev) =>
          prev.filter((o) => !ordersToDelete.some((d) => d.id === o.id))
        );
        setSelectedOrders([]); // Clear selection
        toast.success(
          `Заказ${ordersToDelete.length > 1 ? "ы" : ""} успешно удален${
            ordersToDelete.length > 1 ? "ы" : ""
          }`
        );
      } else {
        toast.error("Ошибка при удалении одного или нескольких заказов");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка при удалении заказов");
    } finally {
      setIsDeleteModalOpen(false);
      setOrdersToDelete([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRowClick = (orderId) => {
    router.push(`/admin/orders/view/${orderId}`);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(paginatedOrders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Заказы</h1>
          <div className="flex gap-2">
            {selectedOrders.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleDeleteClick(
                      orders.filter((o) => selectedOrders.includes(o.id))
                    )
                  }
                >
                  Удалить выбранные ({selectedOrders.length})
                </Button>
              </div>
            )}
            <Button className="hover:bg-primary hover:opacity-75" asChild>
              <Link href="/admin/orders/add">Добавить заказ</Link>
            </Button>
          </div>
        </div>

        {/* Single Search Filter */}
        <div className="mb-6">
          <Label htmlFor="search">Поиск</Label>
          <Input
            id="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Поиск по всем полям (ID, имя, телефон, цена...)"
            className="max-w-md"
          />
        </div>

        {/* Multi-Delete Button */}

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={selectedOrders.length === paginatedOrders.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>ID пользователя</TableHead>
              <TableHead>Имя</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Организация</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Бонус</TableHead>
              <TableHead>Тип заказа</TableHead>
              <TableHead>Комментарий</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Дата обновления</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <Tooltip key={order.id}>
                <TooltipTrigger asChild>
                  <TableRow
                    onClick={() => handleRowClick(order.id)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                      />
                    </TableCell>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.user_id}</TableCell>
                    <TableCell>{order.name || "-"}</TableCell>
                    <TableCell>{order.phone || "-"}</TableCell>
                    <TableCell>{order.organization || "-"}</TableCell>
                    <TableCell>{order.price.toLocaleString()} сум</TableCell>
                    <TableCell>{order.bonus}</TableCell>
                    <TableCell>{order.order_type}</TableCell>
                    <TableCell>{order.comment || "-"}</TableCell>
                    <TableCell>{getStatusDisplay(order.status)}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(order.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            onClick={(e) => e.stopPropagation()}
                            href={`/admin/orders/${order.id}`}
                          >
                            Редактировать
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(order)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TooltipTrigger>
                <TooltipContent className="p-4 bg-white text-black shadow-lg rounded-lg max-w-md">
                  <h3 className="font-bold mb-2">Элементы заказа:</h3>
                  <ul className="list-disc pl-4">
                    {order.order_items.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.name}</strong> - Количество:{" "}
                        {item.order_quantity}, Цена: {item.price} сум
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подтверждение удаления</DialogTitle>
              <DialogDescription>
                Вы действительно хотите удалить{" "}
                {ordersToDelete.length > 1
                  ? `${ordersToDelete.length} заказов`
                  : `заказ (ID: ${ordersToDelete[0]?.id}) - ${
                      ordersToDelete[0]?.order_type === "individual"
                        ? `Имя: ${ordersToDelete[0]?.name}`
                        : `Организация: ${ordersToDelete[0]?.organization}`
                    }`}
                ? Это действие необратимо.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
