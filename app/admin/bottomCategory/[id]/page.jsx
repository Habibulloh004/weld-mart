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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getData } from "@/actions/get";
import { Loader2, CloudUpload, X } from "lucide-react";
import { FileUploader, FileInput } from "@/components/ui/file-uploader";
import { useRouter } from "next/navigation";
import { backUrl, fixImageUrl, isHttpUrl, isUploadPath } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { postData } from "@/actions/post";
import { putData } from "@/actions/put";
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
  name: z.string().min(1, "Название обязательно"),
  description: z.string().min(1, "Описание обязательно"),
  image: z
    .string()
    .min(1, "Изображение обязательно")
    .refine((value) => isHttpUrl(value) || isUploadPath(value), "Неверный формат URL"),
  category_id: z.string().min(1, "ID категории обязателен"),
});

export default function BottomCategoryEvent({ params }) {
  const { id: categoryId } = use(params);
  const router = useRouter();
  const isAddMode = categoryId === "add";
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUrlInput, setCurrentUrlInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      category_id: "",
    },
  });

  const dropZoneConfig = {
    accept: { "image/*": [".svg", ".png", ".jpg", ".jpeg", ".gif"] },
    multiple: false,
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getData("/api/categories", "category");
        setCategories(response.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories", error);
        toast.error("Не удалось загрузить категории");
      }
    };

    const fetchBottomCategory = async () => {
      if (!isAddMode && categoryId) {
        try {
          setIsLoading(true);
          const category = await getData(
            `/api/bottomCategories/${categoryId}`,
            "bottom-category"
          );
          form.reset({
            name: category?.name || "",
            description: category?.description || "",
            image: category?.image || "",
            category_id: category?.category_id?.toString() || "",
          });
          if (category?.image) {
            setImagePreview({
              url: category.image,
              preview: category.image,
              isUploaded: true,
            });
          }
        } catch (error) {
          console.error("Failed to fetch bottom category", error);
          toast.error("Не удалось загрузить данные подкатегории.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchCategories();
    fetchBottomCategory();
  }, [categoryId, isAddMode, form]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file, "bottom-category.webp");

    const requestOptions = {
      method: "POST",
      body: formData,
      redirect: "follow",
    };

    const response = await fetch(`${backUrl}/upload`, requestOptions);
    if (!response.ok) {
      throw new Error(`Image upload failed! status: ${response.status}`);
    }
    const result = await response.json();
    return result.path;
  };

  const handleFileUpload = async (newFiles) => {
    if (newFiles && newFiles.length > 0) {
      try {
        const file = newFiles[0];
        const preview = URL.createObjectURL(file);
        const url = await uploadImage(file);
        const newImage = { url, preview, isUploaded: true };
        setImagePreview(newImage);
        form.setValue("image", url);
      } catch (error) {
        console.error("Image upload failed:", error);
        toast.error("Не удалось загрузить изображение");
      }
    }
  };

  const addUrl = () => {
    if (currentUrlInput) {
      const newImage = {
        url: currentUrlInput,
        preview: currentUrlInput,
        isUploaded: true,
      };
      setImagePreview(newImage);
      form.setValue("image", currentUrlInput);
      setCurrentUrlInput("");
    }
  };

  const removeImage = () => {
    if (imagePreview && !imagePreview.isUploaded) {
      URL.revokeObjectURL(imagePreview.preview);
    }
    setImagePreview(null);
    form.setValue("image", "");
  };

  async function onSubmit(values) {
    try {
      setSubmitLoading(true);
      let result;
      if (isAddMode) {
        result = await postData(
          { ...values, category_id: Number(values?.category_id) },
          "/api/bottomCategories",
          "bottom-category"
        );
      } else {
        result = await putData(
          { ...values, category_id: Number(values?.category_id) },
          `/api/bottomCategories/${categoryId}`,
          "bottom-category"
        );
      }

      if (result && !result.error) {
        if (isAddMode) {
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
          toast.success("Подкатегория успешно добавлена");
          form.reset();
          setImagePreview(null);
        } else {
          toast.info("Подкатегория успешно обновлена");
        }
        router.push("/admin/bottomCategory");
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Ошибка при отправке формы. Попробуйте еще раз.");
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
        Назад
      </Button>
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">
          {isAddMode
            ? "Добавить новую подкатегорию"
            : `Редактировать подкатегорию (ID: ${categoryId || "неизвестно"})`}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите название подкатегории"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Введите описание"
                      value={field.value}
                      onChange={field.onChange}
                      rows={5}
                      className="resize-y"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <FormControl>
                    <Popover
                      open={isPopoverOpen}
                      onOpenChange={setIsPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {field.value
                            ? categories.find(
                                (cat) => String(cat.id) === field.value
                              )?.name || "Выберите категорию"
                            : "Выберите категорию"}
                          <span>▼</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Поиск..."
                            onValueChange={setCategorySearch}
                          />
                          <CommandList>
                            <CommandGroup>
                              {categories
                                .filter((category) =>
                                  category.name
                                    .toLowerCase()
                                    .includes(categorySearch.toLowerCase())
                                )
                                .map((category) => (
                                  <CommandItem
                                    key={category.id}
                                    value={String(category.id)}
                                    onSelect={(value) => {
                                      form.setValue("category_id", value);
                                      field.onChange(value);
                                      setIsPopoverOpen(false); // Close the popover
                                    }}
                                  >
                                    {category.name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Изображение</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <FileUploader
                        value={[]}
                        onValueChange={handleFileUpload}
                        dropzoneOptions={dropZoneConfig}
                        className="relative bg-background rounded-lg p-2"
                      >
                        <FileInput
                          id="imageInput"
                          className="outline-dashed outline-1 outline-slate-500"
                        >
                          <div className="flex items-center justify-center flex-col p-8 w-full">
                            <CloudUpload className="text-gray-500 w-10 h-10" />
                            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">
                                Нажмите для загрузки
                              </span>{" "}
                              или перетащите
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              SVG, PNG, JPG или GIF (макс. 4MB)
                            </p>
                          </div>
                        </FileInput>
                      </FileUploader>

                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/image.jpg"
                          value={currentUrlInput}
                          onChange={(e) => setCurrentUrlInput(e.target.value)}
                        />
                        <Button
                          type="button"
                          onClick={addUrl}
                          disabled={!currentUrlInput}
                        >
                          Добавить URL
                        </Button>
                      </div>

                      {imagePreview && (
                        <div className="relative w-24 h-24">
                          <img
                            src={fixImageUrl(imagePreview.preview)}
                            alt="Предпросмотр"
                            className="w-full h-full object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Загрузите одно изображение или введите URL (обязательно).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={submitLoading}>
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAddMode ? (
                "Добавить подкатегорию"
              ) : (
                "Обновить подкатегорию"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
