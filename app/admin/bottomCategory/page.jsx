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
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getData } from "@/actions/get";
import { deleteData } from "@/actions/delete";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "../_components/Pagination";
import { fixImageUrl } from "@/lib/utils";

const filterItems = (items, searchTerm) => {
  if (!searchTerm) return items;

  const lowerSearchTerm = searchTerm.toLowerCase();
  return items.filter((item) => {
    const fields = {
      id: item.id?.toString() || "",
      name: item.name?.toString() || "",
      created_at: new Date(item.created_at).toLocaleDateString() || "",
      updated_at: new Date(item.updated_at).toLocaleDateString() || "",
    };
    return Object.values(fields).some((value) =>
      value.toLowerCase().includes(lowerSearchTerm)
    );
  });
};

export default function BottomCategory() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoriesToDelete, setCategoriesToDelete] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [bottomCategories, setBottomCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getData(
          "/api/bottomCategories",
          "bottom-category"
        );
        setBottomCategories(response.bottom_categories || []);
      } catch (error) {
        toast.error("Ошибка при загрузке подкатегорий");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const itemsPerPage = 10;
  const filteredCategories = filterItems(
    bottomCategories.slice().reverse(),
    searchTerm
  );
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (categories) => {
    setCategoriesToDelete(
      Array.isArray(categories) ? categories : [categories]
    );
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoriesToDelete.length) return;

    try {
      const deletePromises = categoriesToDelete.map((category) =>
        deleteData(`/api/bottomCategories/${category.id}`, "bottom-category")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setBottomCategories((prev) =>
          prev.filter((c) => !categoriesToDelete.some((d) => d.id === c.id))
        );
        setSelectedCategories([]);
        toast.success(
          `Подкатегори${
            categoriesToDelete.length > 1 ? "и" : "я"
          } успешно удален${categoriesToDelete.length > 1 ? "ы" : "а"}`
        );
        fetch(`/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: "category" }),
        });
        fetch(`/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: "product" }),
        });
      } else {
        toast.error("Ошибка при удалении одной или нескольких подкатегорий");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка при удалении подкатегорий");
    } finally {
      setIsDeleteModalOpen(false);
      setCategoriesToDelete([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedCategories([]);
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCategories(paginatedCategories.map((category) => category.id));
    } else {
      setSelectedCategories([]);
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
        <h1 className="text-2xl font-bold">Подкатегории</h1>
        <div className="flex gap-2">
          {selectedCategories.length > 0 && (
            <Button
              variant="destructive"
              onClick={() =>
                handleDeleteClick(
                  bottomCategories.filter((c) =>
                    selectedCategories.includes(c.id)
                  )
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить выбранные ({selectedCategories.length})
            </Button>
          )}
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/bottomCategory/add">Добавить подкатегорию</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="search">Поиск</Label>
        <Input
          id="search"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Поиск по всем полям (ID, название, даты...)"
          className="max-w-md"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={
                  selectedCategories.length === paginatedCategories.length &&
                  paginatedCategories.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Изображение</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Дата обновления</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCategories.map((category) => (
            <TableRow key={category.id}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleSelectCategory(category.id)}
                />
              </TableCell>
              <TableCell>{category.id}</TableCell>
              <TableCell>{category.name}</TableCell>
              <TableCell>
                <Image
                  src={fixImageUrl(category.image)}
                  alt={category.name}
                  width={50}
                  height={50}
                  className="object-cover"
                />
              </TableCell>
              <TableCell>
                {new Date(category.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(category.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/bottomCategory/${category.id}`}>
                      Редактировать
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(category)}
                  >
                    Удалить
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить{" "}
              {categoriesToDelete.length > 1
                ? `${categoriesToDelete.length} подкатегорий`
                : `подкатегорию "${categoriesToDelete[0]?.name}"`}
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
