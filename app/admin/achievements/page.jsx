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
      title: item.title?.toString() || "",
      created_at: new Date(item.created_at).toLocaleDateString() || "",
      updated_at: new Date(item.updated_at).toLocaleDateString() || "",
    };
    return Object.values(fields).some((value) =>
      value.toLowerCase().includes(lowerSearchTerm)
    );
  });
};

export default function Achievements() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [achievementsToDelete, setAchievementsToDelete] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAchievements, setSelectedAchievements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getData("/api/achievements", "achievement");
        setAchievements(response || []);
      } catch (error) {
        console.log(error);
        toast.error("Ошибка при загрузке достижений");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const itemsPerPage = 10;
  const filteredAchievements = filterItems(achievements.slice().reverse(), searchTerm);
  const totalPages = Math.ceil(filteredAchievements.length / itemsPerPage);
  const paginatedAchievements = filteredAchievements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (achievements) => {
    setAchievementsToDelete(Array.isArray(achievements) ? achievements : [achievements]);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!achievementsToDelete.length) return;

    try {
      const deletePromises = achievementsToDelete.map((achievement) =>
        deleteData(`/api/achievements/${achievement.id}`, "achievement")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setAchievements((prev) =>
          prev.filter((a) => !achievementsToDelete.some((d) => d.id === a.id))
        );
        setSelectedAchievements([]);
        toast.success(
          `Достижение${achievementsToDelete.length > 1 ? "ния" : ""} успешно удалено${achievementsToDelete.length > 1 ? "ы" : ""}`
        );
      } else {
        toast.error("Ошибка при удалении одного или нескольких достижений");
      }
    } catch (error) {
      console.error("Ошибка удаления:", error);
      toast.error("Ошибка при удалении достижений");
    } finally {
      setIsDeleteModalOpen(false);
      setAchievementsToDelete([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedAchievements([]);
  };

  const handleSelectAchievement = (achievementId) => {
    setSelectedAchievements((prev) =>
      prev.includes(achievementId)
        ? prev.filter((id) => id !== achievementId)
        : [...prev, achievementId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAchievements(paginatedAchievements.map((achievement) => achievement.id));
    } else {
      setSelectedAchievements([]);
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
        <h1 className="text-2xl font-bold">Достижения</h1>
        <div className="flex gap-2">
          {selectedAchievements.length > 0 && (
            <Button
              variant="destructive"
              onClick={() =>
                handleDeleteClick(
                  achievements.filter((a) => selectedAchievements.includes(a.id))
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить выбранные ({selectedAchievements.length})
            </Button>
          )}
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/achievements/add">Добавить достижение</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="search">Поиск</Label>
        <Input
          id="search"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Поиск по всем полям (ID, заголовок, даты...)"
          className="max-w-md"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  selectedAchievements.length === paginatedAchievements.length &&
                  paginatedAchievements.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Заголовок</TableHead>
            <TableHead>Изображение</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Дата обновления</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedAchievements.map((achievement) => (
            <TableRow key={achievement.id}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedAchievements.includes(achievement.id)}
                  onCheckedChange={() => handleSelectAchievement(achievement.id)}
                />
              </TableCell>
              <TableCell>{achievement.id}</TableCell>
              <TableCell>{achievement.title}</TableCell>
              <TableCell>
                <Image
                  src={fixImageUrl(achievement.image)}
                  alt={achievement.title}
                  width={50}
                  height={50}
                  className="object-cover"
                />
              </TableCell>
              <TableCell>
                {new Date(achievement.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(achievement.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/achievements/${achievement.id}`}>
                      Редактировать
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(achievement)}
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
              Вы действительно хотите удалить{" "}
              {achievementsToDelete.length > 1
                ? `${achievementsToDelete.length} достижений`
                : `достижение с ID: ${achievementsToDelete[0]?.id} - Заголовок: ${achievementsToDelete[0]?.title}`}
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