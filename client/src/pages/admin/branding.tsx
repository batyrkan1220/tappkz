import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Palette, CheckCircle2 } from "lucide-react";
import type { Store, StoreTheme } from "@shared/schema";

const COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#4f46e5"];

export default function BrandingPage() {
  const { toast } = useToast();
  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: theme, isLoading } = useQuery<StoreTheme>({ queryKey: ["/api/my-store/theme"] });

  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    if (theme) {
      setPrimaryColor(theme.primaryColor);
      setLogoUrl(theme.logoUrl || "");
      setBannerUrl(theme.bannerUrl || "");
    }
  }, [theme]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/my-store/theme", {
        storeId: store!.id,
        primaryColor,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/theme"] });
      toast({ title: "Брендирование сохранено" });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const files = e.target.files;
    if (!files?.[0]) return;
    const formData = new FormData();
    formData.append("images", files[0]);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (type === "logo") setLogoUrl(data.urls[0]);
      else setBannerUrl(data.urls[0]);
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
          <Palette className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-branding-title">Брендирование</h1>
          <p className="text-xs text-muted-foreground">Настройте внешний вид витрины</p>
        </div>
      </div>

      <Card className="space-y-6 p-5">
        <div>
          <Label className="mb-2 block font-semibold">Фирменный цвет</Label>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setPrimaryColor(c)}
                className={`relative h-9 w-9 rounded-lg transition-all ${primaryColor === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                style={{ backgroundColor: c }}
                data-testid={`button-color-${c}`}
              >
                {primaryColor === c && (
                  <CheckCircle2 className="absolute inset-0 m-auto h-4 w-4 text-white" />
                )}
              </button>
            ))}
            <Input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-14 cursor-pointer p-0.5"
              data-testid="input-custom-color"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block font-semibold">Логотип</Label>
          {logoUrl ? (
            <div className="relative inline-block">
              <img src={logoUrl} alt="Logo" className="h-20 w-20 rounded-lg border object-cover" />
              <button
                type="button"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                onClick={() => setLogoUrl("")}
                data-testid="button-remove-logo"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed hover-elevate" data-testid="label-logo-upload">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "logo")} data-testid="input-logo-upload" />
            </label>
          )}
        </div>

        <div>
          <Label className="mb-2 block font-semibold">Баннер</Label>
          {bannerUrl ? (
            <div className="relative">
              <img src={bannerUrl} alt="Banner" className="h-32 w-full rounded-lg border object-cover" />
              <button
                type="button"
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                onClick={() => setBannerUrl("")}
                data-testid="button-remove-banner"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed hover-elevate" data-testid="label-banner-upload">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="h-5 w-5" />
                <span className="text-xs">Загрузить баннер</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "banner")} data-testid="input-banner-upload" />
            </label>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Предпросмотр</p>
          <div className="rounded-lg border overflow-hidden">
            {bannerUrl && (
              <div className="h-24 overflow-hidden">
                <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-3 p-3" style={{ borderTop: `3px solid ${primaryColor}` }}>
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: primaryColor + "20" }}>
                  <Palette className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
              )}
              <div>
                <p className="font-extrabold" style={{ color: primaryColor }}>{store?.name || "Ваш магазин"}</p>
                <p className="text-xs text-muted-foreground">{store?.description || "Описание магазина"}</p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-green-600 text-white rounded-full font-semibold" data-testid="button-save-branding">
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </Card>
    </div>
  );
}
