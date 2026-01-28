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
import SubmitButton from "@/components/shared/submitButton";
import { postData } from "@/actions/post";
import { putData } from "@/actions/put";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  description: z.string().min(1, "Описание обязательно"),
  image: z
    .string()
    .min(1, "Требуется изображение")
    .refine((value) => isHttpUrl(value) || isUploadPath(value), "Неверный формат URL"),
});

export default function CategoryEvent({ params }) {
  const { category: id } = use(params);
  const router = useRouter();
  const isAddMode = id === "add";
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUrlInput, setCurrentUrlInput] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
    },
  });

  const dropZoneConfig = {
    accept: {
      "image/*": [".webp", ".svg", ".png", ".jpg", ".jpeg", ".gif"],
    },
    multiple: false,
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
  };

  useEffect(() => {
    if (!isAddMode && id) {
      const fetchCategory = async () => {
        try {
          setIsLoading(true);
          const category = await getData(`/api/categories/${id}`, "category");
          form.reset({
            name: category?.name || "",
            description: category?.description || "",
            image: category?.image || "",
          });
          if (category?.image) {
            setImagePreview({
              url: category.image,
              preview: category.image,
              isUploaded: true,
            });
          }
        } catch (error) {
          console.error("Не удалось загрузить категорию", error);
          toast.error("Не удалось загрузить данные категории.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCategory();
    } else {
      setIsLoading(false);
    }
  }, [id, isAddMode, form]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file, "category");

    const requestOptions = {
      method: "POST",
      body: formData,
      redirect: "follow",
    };

    const response = await fetch(`${backUrl}/upload`, requestOptions);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки изображения! статус: ${response.status}`);
    }
    const result = await response.json();
    return result.path;
  };

  const handleFileUpload = async (uploadedFiles) => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        const file = uploadedFiles[0];
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
      const newImage = { url: currentUrlInput, preview: currentUrlInput, isUploaded: true };
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
        result = await postData(values, "/api/categories", "category");
      } else {
        result = await putData(values, `/api/categories/${id}`, "category");
      }

      if (result && !result.error) {
        if (isAddMode) {
          toast.success("Категория успешно добавлена");
          setImagePreview(null);
        } else {
          toast.info("Категория успешно обновлена");
        }
        router.push("/admin/categories");
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Ошибка отправки формы:", error);
      toast.error("Форма не отправлена. Попробуйте снова.");
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
            ? "Добавить новую категорию"
            : `Редактировать категорию (ID: ${id || "неизвестно"})`}
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
                      placeholder="Введите название категории"
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
                      placeholder="Напишите описание"
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
                              или перетащите изображение
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
                    Загрузите одно изображение или укажите URL. Изображение обязательно.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SubmitButton
              className="w-full"
              isLoading={submitLoading}
              disabled={submitLoading}
            >
              {isAddMode ? "Добавить категорию" : "Обновить категорию"}
            </SubmitButton>
          </form>
        </Form>
      </div>
    </>
  );
}
