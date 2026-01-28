"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getData } from "@/actions/get";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { postData } from "@/actions/post";
import { putData } from "@/actions/put";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const formSchema = z.object({
  email: z.string().email("Требуется действительный email"),
  user_id: z.any().optional(), // Изменено на user_id и сделано необязательным
});

export default function MailingListEvent({ params }) {
  const { id: mailingId } = use(params); // Динамический параметр маршрута для ID рассылки
  const router = useRouter();
  const isAddMode = mailingId === "add";
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [users, setUsers] = useState([]); // Состояние для загруженных пользователей
  const [isUsersLoading, setIsUsersLoading] = useState(true); // Отслеживание состояния загрузки пользователей
  const [userSearch, setUserSearch] = useState(""); // Состояние для ввода поиска
  const [open, setOpen] = useState(false); // Состояние для открытия/закрытия Popover

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      user_id: "", // Изменено на user_id
    },
  });

  // Загрузка пользователей для выпадающего списка
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsUsersLoading(true);
        const userData = await getData("/api/users", "user");
        setUsers(userData || []);
      } catch (error) {
        console.error("Не удалось загрузить пользователей", error);
        toast.error("Не удалось загрузить список пользователей.");
      } finally {
        setIsUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Загрузка существующих данных рассылки в режиме редактирования
  useEffect(() => {
    if (!isAddMode && mailingId) {
      const fetchMailing = async () => {
        try {
          setIsLoading(true);
          const mailing = await getData(
            `/api/rassikas/${mailingId}`,
            "rassilka"
          );
          form.reset({
            email: mailing?.email || "",
            user_id: mailing?.user_id || "", // Изменено на user_id
          });
        } catch (error) {
          console.error("Не удалось загрузить данные рассылки", error);
          toast.error("Не удалось загрузить данные рассылки.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchMailing();
    } else {
      setIsLoading(false);
    }
  }, [mailingId, isAddMode, form]);

  // Фильтрация пользователей на основе поискового ввода
  const filteredUsers = users.filter((user) =>
    `${user.name || ""} ${user.id}`
      .toLowerCase()
      .includes(userSearch.toLowerCase())
  );

  async function onSubmit(values) {
    try {
      setSubmitLoading(true);
      let data = {
        email: values.email,
      };
      if (values.user_id) {
        data.user_id = values.user_id;
      }
      let result;
      if (isAddMode) {
        result = await postData(data, "/api/rassikas", "rassilka");
      } else {
        result = await putData(data, `/api/rassikas/${mailingId}`, "rassilka");
      }

      if (result && !result.error) {
        if (isAddMode) {
          toast.success("Запись в список рассылки успешно добавлена");
          form.reset();
        } else {
          toast.info("Запись в список рассылки успешно обновлена");
        }
        router.push("/admin/mailing-list");
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Ошибка отправки формы:", error);
      toast.error("Не удалось отправить форму. Попробуйте снова.");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => window.history.back()}
        className="hover:bg-primary hover:opacity-75"
      >
        Вернуться назад
      </Button>
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">
          {isAddMode
            ? "Добавить новую запись в список рассылки"
            : `Редактировать запись списка рассылки (ID: ${
                mailingId || "неизвестно"
              })`}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Введите адрес электронной почты"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_id" // Изменено на user_id
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пользователь (необязательно)</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          disabled={isUsersLoading}
                        >
                          {field.value
                            ? users.find((user) => user.id === field.value)
                                ?.name || "Безымянный пользователь"
                            : "Выберите пользователя"}
                          <span className="ml-2">▼</span>
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Поиск пользователей..."
                          className="h-9"
                          value={userSearch}
                          onValueChange={setUserSearch}
                        />
                        <CommandList>
                          {isUsersLoading ? (
                            <CommandEmpty>
                              Загрузка пользователей...
                            </CommandEmpty>
                          ) : users.length === 0 ? (
                            <CommandEmpty>
                              Нет доступных пользователей
                            </CommandEmpty>
                          ) : (
                            <>
                              <CommandGroup>
                                {/* Добавлена опция для очистки выбора */}
                                <CommandItem
                                  value="none"
                                  onSelect={() => {
                                    field.onChange(""); // Очистить выбор
                                    setOpen(false);
                                  }}
                                >
                                  <div className="flex justify-between w-full">
                                    <span>Нет</span>
                                  </div>
                                </CommandItem>
                                {filteredUsers.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={(currentValue) => {
                                      field.onChange(currentValue);
                                      setOpen(false);
                                    }}
                                  >
                                    <div className="flex justify-between w-full">
                                      <span>
                                        {user.name || "Безымянный пользователь"}
                                      </span>
                                      <span>ID: {user.id}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              {filteredUsers.length === 0 && (
                                <CommandEmpty>
                                  Пользователи по запросу "{userSearch}" не
                                  найдены
                                </CommandEmpty>
                              )}
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full hover:bg-primary"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAddMode ? (
                "Добавить запись в рассылку"
              ) : (
                "Обновить запись в рассылке"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
