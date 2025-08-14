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
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox import
import { getData } from "@/actions/get";
import { Loader2, Trash2 } from "lucide-react";
import { deleteData } from "@/actions/delete";
import { toast } from "sonner";
import { fixImageUrl, truncateText } from "@/lib/utils";
import Pagination from "../_components/Pagination";
import { Switch } from "@/components/ui/switch";
import { putData } from "@/actions/put";

// General filter function with a single search term
const filterItems = (items, searchTerm) => {
  if (!searchTerm) return items;

  const lowerSearchTerm = searchTerm.toLowerCase();
  return items.filter((item) => {
    const fields = {
      id: item.id?.toString() || "",
      name: item.name?.toString() || "",
      price: item.price?.toString() || "",
      created_at: new Date(item.created_at).toLocaleDateString() || "",
      updated_at: new Date(item.updated_at).toLocaleDateString() || "",
      description: item.description?.toString() || "",
    };
    return Object.values(fields).some((value) =>
      value.toLowerCase().includes(lowerSearchTerm)
    );
  });
};

export default function Products() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productsToDelete, setProductsToDelete] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showPrice, setShowPrice] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await getData(`/api/products`, "product");
        setProducts(response.products || []);
      } catch (error) {
        console.log(error);
        toast.error("Ошибка при загрузке товаров");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const itemsPerPage = 10;
  const filteredProducts = filterItems(products.slice().reverse(), searchTerm);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (products) => {
    setProductsToDelete(Array.isArray(products) ? products : [products]);
    setIsDeleteModalOpen(true);
  };

  const handleShowPrice = async (bool) => {
    try {
      const show = await putData(
        { show: bool },
        `/api/price-switch`,
        "price-switch"
      );
      console.log(show);
      if (show?.data) {
        setShowPrice(bool);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const show = await getData(`/api/price-switch`,"price-switch");
        if(show){
          setShowPrice(Boolean(show?.show))
        }
        console.log(show);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  const handleConfirmDelete = async () => {
    if (!productsToDelete.length) return;

    try {
      const deletePromises = productsToDelete.map((product) =>
        deleteData(`/api/products/${product.id}`, "product")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setProducts((prev) =>
          prev.filter((p) => !productsToDelete.some((d) => d.id === p.id))
        );
        setSelectedProducts([]);
        toast.success(
          `Товар${productsToDelete.length > 1 ? "ы" : ""} успешно удален${
            productsToDelete.length > 1 ? "ы" : ""
          }`
        );
      } else {
        toast.error("Ошибка при удалении одного или нескольких товаров");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка при удалении товаров");
    } finally {
      setIsDeleteModalOpen(false);
      setProductsToDelete([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedProducts([]);
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(paginatedProducts.map((product) => product.id));
    } else {
      setSelectedProducts([]);
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Товары</h1>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <Button
              variant="destructive"
              onClick={() =>
                handleDeleteClick(
                  products.filter((p) => selectedProducts.includes(p.id))
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить выбранные ({selectedProducts.length})
            </Button>
          )}
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/products/add">Добавить товар</Link>
          </Button>
        </div>
      </div>

      {/* Single Common Filter */}
      <div className="flex w-full justify-between items-center gap-5">
        <div className="mb-6">
          <Label htmlFor="search">Поиск</Label>
          <Input
            id="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Поиск по всем полям (ID, название, цена, даты...)"
            className="max-w-md"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="show_price"
            checked={showPrice}
            onCheckedChange={() => {
              handleShowPrice(!showPrice);
            }}
          />

          <Label htmlFor="airplane-mode">Показать сумму</Label>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={
                  selectedProducts.length === paginatedProducts.length &&
                  paginatedProducts.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Описание</TableHead>
            <TableHead>Изображение</TableHead>
            <TableHead>Цена</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Дата обновления</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => handleSelectProduct(product.id)}
                />
              </TableCell>
              <TableCell>{product.id}</TableCell>
              <TableCell>{truncateText(product.name, 50)}</TableCell>
              <TableCell>{truncateText(product.description, 100)}</TableCell>
              <TableCell>
                <Image
                  src={fixImageUrl(product.images[0])}
                  alt={product.name}
                  width={50}
                  height={50}
                  className="object-cover"
                />
              </TableCell>
              <TableCell>{product.price.toLocaleString()} сум</TableCell>
              <TableCell>
                {new Date(product.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(product.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/products/${product.id}`}>
                      Редактировать
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(product)}
                  >
                    Удалить
                  </Button>
                </div>
              </TableCell>
            </TableRow>
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
              Вы уверены, что хотите удалить{" "}
              {productsToDelete.length > 1
                ? `${productsToDelete.length} товаров`
                : `товар "${productsToDelete[0]?.name}"`}
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
  );
}
