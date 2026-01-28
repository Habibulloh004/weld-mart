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
import { getData } from "@/actions/get";
import { Loader2, CloudUpload, X } from "lucide-react";
import { FileUploader, FileInput } from "@/components/ui/file-uploader";
import { useRouter } from "next/navigation";
import { backUrl, fixImageUrl, isHttpUrl, isUploadPath } from "@/lib/utils";
import { postData } from "@/actions/post";
import { putData } from "@/actions/put";

const formSchema = z.object({
  image: z
    .string()
    .min(1, "Изображение обязательно")
    .refine((value) => isHttpUrl(value) || isUploadPath(value), "Неверный формат URL"),
});

export default function ClientEvent({ params }) {
  const { id: clientId } = use(params);
  const router = useRouter();
  const isAddMode = clientId === "add";
  const [isLoading, setIsLoading] = useState(!isAddMode);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: "",
    },
  });

  const dropZoneConfig = {
    accept: { "image/*": [".svg", ".png", ".jpg", ".jpeg", ".gif"] },
    multiple: false,
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
  };

  useEffect(() => {
    if (!isAddMode && clientId) {
      const fetchClient = async () => {
        try {
          setIsLoading(true);
          const client = await getData(`/api/clients/${clientId}`, "client");
          form.reset({
            image: client?.image || "",
          });
          if (client?.image) {
            setImagePreview({
              url: client.image,
              preview: client.image,
              isUploaded: true,
            });
          }
        } catch (error) {
          console.error("Ошибка загрузки клиента", error);
          toast.error("Не удалось загрузить данные клиента.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchClient();
    } else {
      setIsLoading(false);
    }
  }, [clientId, isAddMode, form]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file, "client.webp");

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
        console.error("Ошибка загрузки изображения:", error);
        toast.error("Не удалось загрузить изображение");
      }
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
        result = await postData(values, "/api/clients", "client");
      } else {
        result = await putData(values, `/api/clients/${clientId}`, "client");
      }

      if (result && !result.error) {
        if (isAddMode) {
          toast.success("Клиент успешно добавлен");
          form.reset();
          setImagePreview(null);
        } else {
          toast.info("Клиент успешно обновлен");
        }
        router.push("/admin/clients");
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
        Назад
      </Button>
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">
          {isAddMode
            ? "Добавить нового клиента"
            : `Редактировать клиента (ID: ${clientId || "неизвестно"})`}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    Загрузите одно изображение (обязательно).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={submitLoading}>
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAddMode ? (
                "Добавить клиента"
              ) : (
                "Обновить клиента"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
