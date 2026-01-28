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
      created_at: new Date(item.created_at).toLocaleDateString() || "",
      updated_at: new Date(item.updated_at).toLocaleDateString() || "",
    };
    return Object.values(fields).some((value) =>
      value.toLowerCase().includes(lowerSearchTerm)
    );
  });
};

export default function Clients() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientsToDelete, setClientsToDelete] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getData("/api/clients", "client");
        setClients(response || []);
      } catch (error) {
        toast.error("Ошибка при загрузке клиентов");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const itemsPerPage = 10;
  const filteredClients = filterItems(clients.slice().reverse(), searchTerm);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (clients) => {
    setClientsToDelete(Array.isArray(clients) ? clients : [clients]);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientsToDelete.length) return;

    try {
      const deletePromises = clientsToDelete.map((client) =>
        deleteData(`/api/clients/${client.id}`, "client")
      );
      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((res) => res.success);

      if (allSuccessful) {
        setClients((prev) =>
          prev.filter((c) => !clientsToDelete.some((d) => d.id === c.id))
        );
        setSelectedClients([]);
        toast.success(
          `Клиент${clientsToDelete.length > 1 ? "ы" : ""} успешно удален${
            clientsToDelete.length > 1 ? "ы" : ""
          }`
        );
      } else {
        toast.error("Ошибка при удалении одного или нескольких клиентов");
      }
    } catch (error) {
      console.error("Ошибка удаления:", error);
      toast.error("Ошибка при удалении клиентов");
    } finally {
      setIsDeleteModalOpen(false);
      setClientsToDelete([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedClients([]);
  };

  const handleSelectClient = (clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedClients(paginatedClients.map((client) => client.id));
    } else {
      setSelectedClients([]);
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
        <h1 className="text-2xl font-bold">Клиенты</h1>
        <div className="flex gap-2">
          {selectedClients.length > 0 && (
            <Button
              variant="destructive"
              onClick={() =>
                handleDeleteClick(
                  clients.filter((c) => selectedClients.includes(c.id))
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить выбранные ({selectedClients.length})
            </Button>
          )}
          <Button className="hover:bg-primary hover:opacity-75" asChild>
            <Link href="/admin/clients/add">Добавить клиента</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Label htmlFor="search">Поиск</Label>
        <Input
          id="search"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Поиск по ID или датам..."
          className="max-w-md"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={
                  selectedClients.length === paginatedClients.length &&
                  paginatedClients.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Изображение</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead>Дата обновления</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedClients.map((client) => (
            <TableRow key={client.id}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedClients.includes(client.id)}
                  onCheckedChange={() => handleSelectClient(client.id)}
                />
              </TableCell>
              <TableCell>{client.id}</TableCell>
              <TableCell>
                <Image
                  src={fixImageUrl(client.image)}
                  alt={`Клиент ${client.id}`}
                  width={50}
                  height={50}
                  className="object-cover"
                />
              </TableCell>
              <TableCell>
                {new Date(client.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(client.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/clients/${client.id}`}>
                      Редактировать
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(client)}
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
              {clientsToDelete.length > 1
                ? `${clientsToDelete.length} клиентов`
                : "этого клиента"}
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