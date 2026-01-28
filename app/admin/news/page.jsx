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
import { fixImageUrl, truncateText } from "@/lib/utils";
import Pagination from "../_components/Pagination";

const filterItems = (items, searchTerm) => {
  if (!searchTerm) return items;

  const lowerSearchTerm = searchTerm.toLowerCase();
  return items.filter((item) => {
    const fields = {
      id: item.id?.toString() || "",
      text: item.text?.toString() || "",
      created_at: new Date(item.created_at).toLocaleDateString() || "",
      updated_at: new Date(item.updated_at).toLocaleDateString() || "",
    };
    return Object.values(fields).some((value) =>
      value.toLowerCase().includes(lowerSearchTerm)
    );
  });
};

export default function News() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getData("/api/news", "new");
        setNews(response || []);
      } catch (error) {
        toast.error("Ошибка при загрузке новостей");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const itemsPerPage = 10;
  const filteredNews = filterItems(news.slice().reverse(), searchTerm);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (newsItems) => {
    setNewsToDelete(Array.isArray(newsItems) ? newsItems : [newsItems]);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!newsToDelete.length) return;

    try {
      const deletePromises = newsToDelete.map((item) =>
        deleteData(`/api/news/${item.id}`, "new")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setNews((prev) =>
          prev.filter((n) => !newsToDelete.some((d) => d.id === n.id))
        );
        setSelectedNews([]);
        toast.success(
          `Новост${newsToDelete.length > 1 ? "и" : "ь"} успешно удален${
            newsToDelete.length > 1 ? "ы" : "а"
          }`
        );
      } else {
        toast.error("Ошибка при удалении одной или нескольких новостей");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка при удалении новостей");
    } finally {
      setIsDeleteModalOpen(false);
      setNewsToDelete([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedNews([]);
  };

  const handleSelectNews = (newsId) => {
    setSelectedNews((prev) =>
      prev.includes(newsId)
        ? prev.filter((id) => id !== newsId)
        : [...prev, newsId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedNews(paginatedNews.map((item) => item.id));
    } else {
      setSelectedNews([]);
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
        <h1 className="text-2xl font-bold">Новости</h1>
        <div className="flex gap-2">
          {selectedNews.length > 0 && (
            <Button
              variant="destructive"
              onClick={() =>
                handleDeleteClick(news.filter((n) => selectedNews.includes(n.id)))
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить выбранные ({selectedNews.length})
            </Button>
          )}
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/news/add">Добавить новость</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="search">Поиск</Label>
        <Input
          id="search"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Поиск по всем полям (ID, текст, даты...)"
          className="max-w-md"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={
                  selectedNews.length === paginatedNews.length &&
                  paginatedNews.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Текст</TableHead>
            <TableHead>Изображение</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Дата обновления</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedNews.map((item) => (
            <TableRow key={item.id}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedNews.includes(item.id)}
                  onCheckedChange={() => handleSelectNews(item.id)}
                />
              </TableCell>
              <TableCell>{item.id}</TableCell>
              <TableCell>{truncateText(item.text, 100)}</TableCell>
              <TableCell>
                <Image
                  src={fixImageUrl(item.image)}
                  alt={`News ${item.id}`}
                  width={50}
                  height={50}
                  className="object-cover"
                />
              </TableCell>
              <TableCell>
                {new Date(item.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(item.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/news/${item.id}`}>Редактировать</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(item)}
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
              {newsToDelete.length > 1
                ? `${newsToDelete.length} новостей`
                : `новость (ID: ${newsToDelete[0]?.id} - Текст: ${truncateText(newsToDelete[0]?.text || "", 50)})`}
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