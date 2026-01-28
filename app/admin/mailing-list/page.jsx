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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getData } from "@/actions/get";
import { History, Loader2, Trash2 } from "lucide-react";
import { deleteData } from "@/actions/delete";
import { toast } from "sonner";
import { postData } from "@/actions/post";
import Pagination from "../_components/Pagination";
import Todo from "@/components/shared/note/NotePicker";

const filterItems = (items, searchTerm) => {
  if (!searchTerm) return items;

  const lowerSearchTerm = searchTerm.toLowerCase();
  return items.filter((item) => {
    const fields = {
      id: item.id?.toString() || "",
      email: item.email?.toString() || "",
      user_id: item.user_id?.toString() || "",
      created_at: new Date(item.created_at).toLocaleDateString() || "",
      updated_at: new Date(item.updated_at).toLocaleDateString() || "",
    };
    return Object.values(fields).some((value) =>
      value.toLowerCase().includes(lowerSearchTerm)
    );
  });
};

export default function MailingList() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [mailingList, setMailingList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [emailTitle, setEmailTitle] = useState("");
  const [emailDescription, setEmailDescription] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getData("/api/rassikas", "rassilka");
        setMailingList(response || []);
      } catch (error) {
        toast.error("Ошибка при загрузке списка рассылки");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const itemsPerPage = 10;
  const filteredMailingList = filterItems(
    mailingList.slice().reverse(),
    searchTerm
  );
  const totalPages = Math.ceil(filteredMailingList.length / itemsPerPage);
  const paginatedMailingList = filteredMailingList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (items) => {
    setItemsToDelete(Array.isArray(items) ? items : [items]);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemsToDelete.length) return;

    try {
      const deletePromises = itemsToDelete.map((item) =>
        deleteData(`/api/rassikas/${item.id}`, "rassilka")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setMailingList((prev) =>
          prev.filter((item) => !itemsToDelete.some((d) => d.id === item.id))
        );
        setSelectedItems([]);
        toast.success(
          `Элемент${itemsToDelete.length > 1 ? "ы" : ""} успешно удален${
            itemsToDelete.length > 1 ? "ы" : ""
          }`
        );
      } else {
        toast.error("Ошибка при удалении одного или нескольких элементов");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Ошибка при удалении элементов");
    } finally {
      setIsDeleteModalOpen(false);
      setItemsToDelete([]);
    }
  };

  const handleSendEmailClick = () => {
    if (selectedItems.length === 0) {
      toast.warning("Выберите хотя бы один адрес для отправки");
      return;
    }
    setEmailTitle("");
    setEmailDescription("");
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTitle || !emailDescription) {
      toast.error("Пожалуйста, укажите заголовок и описание");
      return;
    }

    setIsSending(true);
    try {
      const emails = selectedItems.map((item) => item.email);
      const response = await fetch(
         `https://weld-mart.vercel.app/api/send-emails`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emails,
            subject: emailTitle,
            message: emailDescription,
          }),
        }
      );
      const hrassikas = await postData(
        { title: emailTitle, body: emailDescription },
        `/api/hrassikas`,
        "rassilka"
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Не удалось отправить письма");
      }

      toast.success(
        `Успешно отправлено писем: ${selectedItems.length} получателям`
      );
      setIsEmailModalOpen(false);
      setSelectedItems([]);
    } catch (error) {
      console.error("Ошибка отправки писем:", error);
      toast.error("Не удалось отправить письма. Попробуйте снова.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedItems([]);
  };

  const handleContentChange = (reason) => {
    setEmailDescription(reason);
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.some((item) => item.id === itemId)
        ? prev.filter((item) => item.id !== itemId)
        : [...prev, mailingList.find((item) => item.id === itemId)]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems([...paginatedMailingList]);
    } else {
      setSelectedItems([]);
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
        <h1 className="text-2xl font-bold">Список рассылки</h1>
        <div className="flex gap-2">
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/mailing-list/history">
              <History className="mr-2 h-4 w-4" />
              История рассылки
            </Link>
          </Button>
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/mailing-list/add">Добавить email</Link>
          </Button>
          {selectedItems.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => handleDeleteClick(selectedItems)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить выбранные ({selectedItems.length})
            </Button>
          )}
          <Button
            variant="outline"
            disabled={selectedItems.length === 0}
            onClick={handleSendEmailClick}
          >
            Отправить письмо ({selectedItems.length})
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="search">Поиск</Label>
        <Input
          id="search"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Поиск по всем полям (ID, email, даты...)"
          className="max-w-md"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={
                  paginatedMailingList.length > 0 &&
                  selectedItems.length === paginatedMailingList.length
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>ID пользователя</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Дата обновления</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedMailingList.map((item) => (
            <TableRow key={item.id}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedItems.some((i) => i.id === item.id)}
                  onCheckedChange={() => handleSelectItem(item.id)}
                />
              </TableCell>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>{item.user_id || "-"}</TableCell>
              <TableCell>
                {new Date(item.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(item.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
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
              Вы действительно хотите удалить{" "}
              {itemsToDelete.length > 1
                ? `${itemsToDelete.length} элементов`
                : `элемент (ID: ${itemsToDelete[0]?.id} - Email: ${itemsToDelete[0]?.email})`}
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

      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправка письма</DialogTitle>
            <DialogDescription>
              Введите заголовок и описание для отправки письма на{" "}
              {selectedItems.length} выбранных адресов.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="emailTitle">Заголовок</Label>
              <Input
                id="emailTitle"
                value={emailTitle}
                onChange={(e) => setEmailTitle(e.target.value)}
                placeholder="Введите заголовок письма"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailDescription">Описание</Label>
              {/* <Textarea
                id="emailDescription"
                value={emailDescription}
                onChange={(e) => setEmailDescription(e.target.value)}
                placeholder="Введите описание письма"
                rows={4}
              /> */}
              <Todo
                name="emailDescription"
                handleContentChange={handleContentChange}
                content={emailDescription}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailModalOpen(false)}
            >
              Отмена
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Отправить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
