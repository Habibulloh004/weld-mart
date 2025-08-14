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
      url: item.url?.toString() || "",
      created_at: item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : "",
      updated_at: item.updated_at
        ? new Date(item.updated_at).toLocaleDateString()
        : "",
    };
    return Object.values(fields).some((value) =>
      value.toLowerCase().includes(lowerSearchTerm)
    );
  });
};

export default function Banner() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bannersToDelete, setBannersToDelete] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBanners, setSelectedBanners] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getData("/api/banners", "banner");
        setBanners(response || []);
      } catch (error) {
        console.error("Error fetching banners:", error);
        toast.error("Ошибка при загрузке баннеров");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const itemsPerPage = 10;
  const filteredBanners = filterItems(banners.slice().reverse(), searchTerm);
  const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);
  const paginatedBanners = filteredBanners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (banners) => {
    setBannersToDelete(Array.isArray(banners) ? banners : [banners]);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bannersToDelete.length) return;

    try {
      const deletePromises = bannersToDelete.map((banner) =>
        deleteData(`/api/banners/${banner.id}`, "banner")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setBanners((prev) =>
          prev.filter((b) => !bannersToDelete.some((d) => d.id === b.id))
        );
        setSelectedBanners([]);
        toast.success(
          `Баннер${bannersToDelete.length > 1 ? "ы" : ""} успешно удален${
            bannersToDelete.length > 1 ? "ы" : ""
          }`
        );
      } else {
        toast.error("Ошибка при удалении одного или нескольких баннеров");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка при удалении баннеров");
    } finally {
      setIsDeleteModalOpen(false);
      setBannersToDelete([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedBanners([]);
  };

  const handleSelectBanner = (bannerId) => {
    setSelectedBanners((prev) =>
      prev.includes(bannerId)
        ? prev.filter((id) => id !== bannerId)
        : [...prev, bannerId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedBanners(paginatedBanners.map((banner) => banner.id));
    } else {
      setSelectedBanners([]);
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
        <h1 className="text-2xl font-bold">Баннеры</h1>
        <div className="flex gap-2">
          {selectedBanners.length > 0 && (
            <Button
              variant="destructive"
              onClick={() =>
                handleDeleteClick(
                  banners.filter((b) => selectedBanners.includes(b.id))
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить выбранные ({selectedBanners.length})
            </Button>
          )}
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/banners/add">Добавить баннер</Link>
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
          placeholder="Поиск по всем полям (ID, URL, даты...)"
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
                  selectedBanners.length === paginatedBanners.length &&
                  paginatedBanners.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Изображение</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Дата обновления</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedBanners.map((banner) => (
            <TableRow key={banner.id}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedBanners.includes(banner.id)}
                  onCheckedChange={() => handleSelectBanner(banner.id)}
                />
              </TableCell>
              <TableCell>{banner.id}</TableCell>
              <TableCell>{banner.url}</TableCell>
              <TableCell>
                <Image
                  src={fixImageUrl(banner.image)}
                  alt={`Banner ${banner.id}`}
                  width={50}
                  height={50}
                  className="object-cover"
                />
              </TableCell>
              <TableCell>
                {banner.created_at
                  ? new Date(banner.created_at).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>
                {banner.updated_at
                  ? new Date(banner.updated_at).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/banners/${banner.id}`}>
                      Редактировать
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(banner)}
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
              {bannersToDelete.length > 1
                ? `${bannersToDelete.length} баннеров`
                : `баннер "${bannersToDelete[0]?.url}"`}
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