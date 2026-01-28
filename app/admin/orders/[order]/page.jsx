"use client";

import { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getData } from "@/actions/get";
import { Loader2, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { backUrl } from "@/lib/utils";
import { postData } from "@/actions/post";
import { putData } from "@/actions/put";

const formSchema = z.object({
  bonus: z.number().min(0, "Бонус не может быть отрицательным"),
  user_id: z.number().int().min(1, "ID пользователя должен быть положительным целым числом"),
  order_type: z.enum(["individual", "legal"], {
    required_error: "Тип заказа обязателен",
  }),
  phone: z
    .string()
    .min(1, "Телефон обязателен")
    .regex(/^\+?[1-9]\d{1,14}$/, "Неверный формат номера телефона"),
  name: z.string().min(1, "Имя обязательно"),
  organization: z.string().optional(),
  inn: z.string().optional(),
  comment: z.string().optional(),
  order_items: z
    .array(
      z.object({
        product_id: z.number().int().min(1, "ID продукта обязателен"),
        order_quantity: z.number().int().min(1, "Количество должно быть не менее 1"),
      })
    )
    .min(1, "Требуется хотя бы один элемент заказа"),
});

export default function OrderEvent({ params }) {
  const { order: id } = use(params);
  const router = useRouter();
  const isAddMode = id === "add";
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [productSearches, setProductSearches] = useState({});

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bonus: 0,
      user_id: 0,
      order_type: "individual",
      phone: "",
      name: "",
      organization: "",
      inn: "",
      comment: "",
      order_items: [{ product_id: 0, order_quantity: 1 }],
    },
  });
  const [changeProduct, setChangeProducts] = useState(false);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "order_items",
  });

  // Watch order_items and order_type for dynamic updates
  const orderType = form.watch("order_type");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const usersData = await getData("/api/users");
        const productsData = await getData("/api/products");

        setUsers(usersData || []);
        setProducts(productsData?.products || []);

        if (!isAddMode && id) {
          const order = await getData(`/api/orders/${id}`);
          form.reset({
            bonus: order?.bonus || 0,
            user_id: order?.user_id || 0,
            order_type: order?.order_type || "individual",
            phone: order?.phone || "",
            name: order?.name || "",
            organization: order?.organization || "",
            inn: order?.inn || "",
            comment: order?.comment || "",
            order_items: order?.order_items?.map((item) => ({
              product_id: item.id,
              order_quantity: item.order_quantity || 1,
            })) || [{ product_id: 0, order_quantity: 1 }],
          });
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Не удалось загрузить данные заказа.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, isAddMode, form]);

  const calculateTotalPrice = () => {
    const total = form.getValues().order_items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.product_id);
      const price = product?.price || 0;
      const quantity = item.order_quantity || 0;
      return sum + price * quantity;
    }, 0);
    return Number(total);
  };

  async function onSubmit(values) {
    try {
      setSubmitLoading(true);

      const payload = {
        price: calculateTotalPrice(),
        bonus: values.bonus,
        user_id: values.user_id,
        order_type: values.order_type,
        phone: values.phone,
        name: values.name,
        organization:
          values.order_type === "legal" ? values.organization : null,
        inn: values.order_type === "legal" ? values.inn : null,
        comment: values.comment || null,
        order_items: values.order_items.map((item) => ({
          product_id: item.product_id,
          quantity: item.order_quantity,
        })),
      };

      let result;
      if (isAddMode) {
        result = await postData(
          payload,
          `${
            values.order_type === "legal"
              ? "/api/legal-orders"
              : "/api/individual-orders"
          }`,
          "order"
        );
      } else {
        result = await putData(payload, `/api/orders/${id}`, "order");
      }

      if (result && !result.error) {
        if (isAddMode) {
          toast.success("Заказ успешно добавлен");
          form.reset();
        } else {
          toast.info("Заказ успешно обновлен");
        }
        router.push("/admin/orders");
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Форма не отправлена. Попробуйте еще раз.");
    } finally {
      setSubmitLoading(false);
    }
  }

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getFilteredProducts = (index) => {
    const searchTerm = productSearches[index] || "";
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleProductSearchChange = (index, value) => {
    setProductSearches((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

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
            ? "Добавить новый заказ"
            : `Редактировать заказ (ID: ${id || "неизвестно"})`}
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h1>
                Общая стоимость: <span>{calculateTotalPrice()}</span>
              </h1>
            </div>

            <FormField
              control={form.control}
              name="bonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Бонус</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Введите количество бонусов"
                      step="0.01"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пользователь</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {field.value
                            ? users.find((user) => user.id === field.value)
                                ?.name
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
                          onValueChange={setUserSearch}
                        />
                        <CommandList>
                          <CommandGroup>
                            {filteredUsers.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={`${user.name} (ID: ${user.id})`}
                                onSelect={() => {
                                  field.onChange(user.id);
                                }}
                              >
                                {user.name} (ID: {user.id})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип заказа</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border">
                        <SelectValue placeholder="Выберите тип заказа" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="individual">Физическое лицо</SelectItem>
                      <SelectItem value="legal">Юридическое лицо</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите номер телефона (например, +79991234567)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Используйте международный формат (например, +79991234567).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите имя клиента" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {orderType === "legal" && (
              <>
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Организация</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите название организации"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Требуется для юридических лиц.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ИНН</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите ИНН" {...field} />
                      </FormControl>
                      <FormDescription>
                        Требуется для юридических лиц.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите комментарий (необязательно)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Товары заказа</h2>
              {fields.map((item, index) => {
                const selectedProduct = products.find(
                  (p) =>
                    p.id === form.getValues(`order_items.${index}.product_id`)
                );
                const productPrice = selectedProduct?.price || 0;
                const quantity =
                  form.watch(`order_items.${index}.order_quantity`) || 1;
                const subtotal = productPrice * quantity;

                return (
                  <div key={item.id} className="flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name={`order_items.${index}.product_id`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Продукт</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {field.value
                                    ? products.find(
                                        (product) => product.id === field.value
                                      )?.name
                                    : "Выберите продукт"}
                                  <span className="ml-2">▼</span>
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Поиск продуктов..."
                                  className="h-9"
                                  onValueChange={(value) =>
                                    handleProductSearchChange(index, value)
                                  }
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    Продукт не найден.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {getFilteredProducts(index).map(
                                      (product) => (
                                        <CommandItem
                                          key={product.id}
                                          value={`${product.name} (ID: ${product.id})`}
                                          onSelect={() => {
                                            setChangeProducts(!changeProduct);
                                            field.onChange(product.id);
                                          }}
                                        >
                                          {product.name} (ID: {product.id}) -{" "}
                                          {product.price} сум.
                                        </CommandItem>
                                      )
                                    )}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`order_items.${index}.order_quantity`}
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormLabel>Количество</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Количество"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="w-32">
                      <FormLabel>Цена</FormLabel>
                      <div className="text-sm">
                        {productPrice.toLocaleString()} сум.
                      </div>
                    </div>

                    <div className="w-32">
                      <FormLabel>Итого</FormLabel>
                      <div className="text-sm">
                        {subtotal.toLocaleString()} сум.
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ product_id: 0, order_quantity: 1 })}
                disabled={fields.length >= 10}
              >
                Добавить продукт
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={submitLoading}>
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAddMode ? (
                "Добавить заказ"
              ) : (
                "Обновить заказ"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}