"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getData } from "@/actions/get";
import { postData } from "@/actions/post";
import { putData } from "@/actions/put";

export default function Statistics() {
  const router = useRouter();
  const [statistics, setStatistics] = useState({
    products: "0",
    partners: "0",
    clients: "0",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        const data = await getData("/api/statistics", "statistics");
        if (data) {
          setStatistics({
            products: data.products || "0",
            partners: data.partners || "0",
            clients: data.clients || "0",
          });
        } else {
          // If no data exists, keep defaults
          setStatistics({
            products: "0",
            partners: "0",
            clients: "0",
          });
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
        toast.error("Статистик маълумотларни юклашда хатолик юз берди.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatistics();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, "");
    setStatistics((prev) => ({
      ...prev,
      [name]: numericValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      products: statistics.products,
      partners:statistics.partners,
      clients: statistics.clients,
    };
    try {
      let result;
      const existingData = await getData("/api/statistics", "statistics");
      if (existingData) {
        // Update existing statistics
        result = await putData(payload, "/api/statistics", "statistics");
        toast.success("Статистика мувофаққиятли янгиланди");
      } else {
        // Create new statistics
        result = await postData(payload, "/api/statistics", "statistics");
        toast.success("Статистика мувофаққиятли қўшилди");
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save statistics:", error);
      toast.error("Статистик маълумотларни сақлашда хатолик юз берди.");
    } finally {
      setIsSubmitting(false);
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
    <div className="container mx-auto py-10">
      {/* Back Button */}
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push("/admin")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Орқага қайтиш
      </Button>

      {/* Statistics Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-3xl font-bold">Статистика</CardTitle>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSubmitting}
          >
            {isEditing ? "Бекор қилиш" : "Таҳрирлаш"}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="products">Маҳсулотлар сони</Label>
                <Input
                  id="products"
                  name="products"
                  type="number"
                  value={statistics.products}
                  onChange={handleInputChange}
                  placeholder="Маҳсулотлар сонини киритинг"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partners">Ҳамкорлар сони</Label>
                <Input
                  id="partners"
                  name="partners"
                  type="number"
                  value={statistics.partners}
                  onChange={handleInputChange}
                  placeholder="Ҳамкорлар сонини киритинг"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clients">Мижозлар сони</Label>
                <Input
                  id="clients"
                  name="clients"
                  type="number"
                  value={statistics.clients}
                  onChange={handleInputChange}
                  placeholder="Мижозлар сонини киритинг"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="w-full hover:bg-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Сақлаш"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  Бекор қилиш
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-semibold text-gray-700">
                  Маҳсулотлар сони
                </span>
                <span className="text-xl font-bold">
                  {parseInt(statistics.products).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-semibold text-gray-700">
                  Ҳамкорлар сони
                </span>
                <span className="text-xl font-bold">
                  {parseInt(statistics.partners).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-lg font-semibold text-gray-700">
                  Мижозлар сони
                </span>
                <span className="text-xl font-bold">
                  {parseInt(statistics.clients).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
