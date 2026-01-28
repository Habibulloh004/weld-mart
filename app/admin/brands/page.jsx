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
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox import
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getData } from "@/actions/get";
import { deleteData } from "@/actions/delete";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "../_components/Pagination";
import { fixImageUrl } from "@/lib/utils";

// General filter function with a single search term
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

export default function Brands() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brandsToDelete, setBrandsToDelete] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getData("/api/brands", "brand");
        setBrands(response.brands || []);
      } catch (error) {
        toast.error("Ошибка при загрузке брендов");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const itemsPerPage = 10;
  const filteredBrands = filterItems(brands.slice().reverse(), searchTerm);
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (brands) => {
    setBrandsToDelete(Array.isArray(brands) ? brands : [brands]);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!brandsToDelete.length) return;

    try {
      const deletePromises = brandsToDelete.map((brand) =>
        deleteData(`/api/brands/${brand.id}`, "brand")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setBrands((prev) =>
          prev.filter((b) => !brandsToDelete.some((d) => d.id === b.id))
        );
        setSelectedBrands([]);
        toast.success(
          `Бренд${brandsToDelete.length > 1 ? "ы" : ""} успешно удален${
            brandsToDelete.length > 1 ? "ы" : ""
          }`
        );
      } else {
        toast.error("Ошибка при удалении одного или нескольких брендов");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка при удалении брендов");
    } finally {
      setIsDeleteModalOpen(false);
      setBrandsToDelete([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedBrands([]);
  };

  const handleSelectBrand = (brandId) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedBrands(paginatedBrands.map((brand) => brand.id));
    } else {
      setSelectedBrands([]);
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
        <h1 className="text-2xl font-bold">Бренды</h1>
        <div className="flex gap-2">
          {selectedBrands.length > 0 && (
            <Button
              variant="destructive"
              onClick={() =>
                handleDeleteClick(
                  brands.filter((b) => selectedBrands.includes(b.id))
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить выбранные ({selectedBrands.length})
            </Button>
          )}
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/brands/add">Добавить бренд</Link>
          </Button>
        </div>
      </div>

      {/* Single Common Filter */}
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

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={
                  selectedBrands.length === paginatedBrands.length &&
                  paginatedBrands.length > 0
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
          {paginatedBrands.map((brand) => (
            <TableRow key={brand.id}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedBrands.includes(brand.id)}
                  onCheckedChange={() => handleSelectBrand(brand.id)}
                />
              </TableCell>
              <TableCell>{brand.id}</TableCell>
              <TableCell>{brand.name}</TableCell>
              <TableCell>
                <Image
                  src={fixImageUrl(brand.image)}
                  alt={brand.name}
                  width={50}
                  height={50}
                  className="object-cover"
                />
              </TableCell>
              <TableCell>
                {new Date(brand.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(brand.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/brands/${brand.id}`}>
                      Редактировать
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(brand)}
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
              {brandsToDelete.length > 1
                ? `${brandsToDelete.length} брендов`
                : `бренд "${brandsToDelete[0]?.name}"`}
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