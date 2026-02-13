import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Palette, CheckCircle2, ImageIcon, ShoppingBag, MapPin, ShoppingCart, Plus, Menu, Search } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Store, StoreTheme } from "@shared/schema";
import { useBusinessLabels } from "@/hooks/use-business-labels";

const PRIMARY_COLORS = [
  { value: "#2563eb", label: "Синий" },
  { value: "#059669", label: "Зелёный" },
  { value: "#d97706", label: "Оранжевый" },
  { value: "#dc2626", label: "Красный" },
  { value: "#7c3aed", label: "Фиолетовый" },
  { value: "#0891b2", label: "Бирюзовый" },
  { value: "#be185d", label: "Розовый" },
  { value: "#4f46e5", label: "Индиго" },
  { value: "#0d9488", label: "Тёмно-бирюзовый" },
  { value: "#ea580c", label: "Тёмно-оранжевый" },
  { value: "#9333ea", label: "Пурпурный" },
  { value: "#64748b", label: "Серый" },
];

const BUTTON_STYLES = [
  { value: "pill", label: "Округлые", preview: "rounded-full" },
  { value: "rounded", label: "Скруглённые", preview: "rounded-md" },
  { value: "square", label: "Прямые", preview: "rounded-none" },
];

const CARD_STYLES = [
  { value: "bordered", label: "С рамкой" },
  { value: "shadow", label: "С тенью" },
  { value: "flat", label: "Без рамки" },
];

const FONT_STYLES = [
  { value: "modern", label: "Современный", cls: "font-sans" },
  { value: "classic", label: "Классический", cls: "font-serif" },
  { value: "rounded", label: "Округлый", cls: "font-sans tracking-wide" },
];

export default function BrandingPage() {
  const { toast } = useToast();
  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: theme, isLoading } = useQuery<StoreTheme>({ queryKey: ["/api/my-store/theme"] });
  const businessLabels = useBusinessLabels();

  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerOverlay, setBannerOverlay] = useState(true);
  const [buttonStyle, setButtonStyle] = useState("pill");
  const [cardStyle, setCardStyle] = useState("bordered");
  const [fontStyle, setFontStyle] = useState("modern");

  useEffect(() => {
    if (theme) {
      setPrimaryColor(theme.primaryColor);
      setSecondaryColor(theme.secondaryColor || null);
      setLogoUrl(theme.logoUrl || "");
      setBannerUrl(theme.bannerUrl || "");
      setBannerOverlay(theme.bannerOverlay);
      setButtonStyle(theme.buttonStyle);
      setCardStyle(theme.cardStyle);
      setFontStyle(theme.fontStyle);
    }
  }, [theme]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/my-store/theme", {
        storeId: store!.id,
        primaryColor,
        secondaryColor: secondaryColor || null,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
        bannerOverlay,
        buttonStyle,
        cardStyle,
        fontStyle,
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

  const btnRadius = buttonStyle === "pill" ? "rounded-full" : buttonStyle === "rounded" ? "rounded-md" : "rounded-none";
  const cardCls = cardStyle === "bordered" ? "border" : cardStyle === "shadow" ? "shadow-md border-0" : "border-0";

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
          <p className="text-xs text-muted-foreground">Настройте дизайн и оформление магазина</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Фирменные цвета</h2>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-semibold">Основной цвет</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRIMARY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setPrimaryColor(c.value)}
                      className={`relative h-9 w-9 rounded-lg transition-all ${primaryColor === c.value ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                      data-testid={`button-color-${c.value}`}
                    >
                      {primaryColor === c.value && (
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
                <Label className="mb-2 block text-sm font-semibold">Дополнительный цвет</Label>
                <p className="mb-2 text-xs text-muted-foreground">Для акцентов и скидок</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSecondaryColor(null)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-dashed text-xs text-muted-foreground ${!secondaryColor ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                    data-testid="button-secondary-none"
                  >
                    --
                  </button>
                  {PRIMARY_COLORS.slice(0, 8).map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSecondaryColor(c.value)}
                      className={`relative h-9 w-9 rounded-lg transition-all ${secondaryColor === c.value ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                      data-testid={`button-secondary-${c.value}`}
                    >
                      {secondaryColor === c.value && (
                        <CheckCircle2 className="absolute inset-0 m-auto h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                  <Input
                    type="color"
                    value={secondaryColor || "#6b7280"}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-14 cursor-pointer p-0.5"
                    data-testid="input-custom-secondary"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Логотип и баннер</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-sm font-semibold">Логотип</Label>
                {logoUrl ? (
                  <div className="relative inline-block">
                    <img src={logoUrl} alt="Logo" className="h-24 w-24 rounded-xl border object-cover" />
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
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed hover-elevate" data-testid="label-logo-upload">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Загрузить</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "logo")} data-testid="input-logo-upload" />
                  </label>
                )}
              </div>

              <div>
                <Label className="mb-2 block text-sm font-semibold">Баннер</Label>
                {bannerUrl ? (
                  <div className="relative">
                    <img src={bannerUrl} alt="Banner" className="h-24 w-full rounded-xl border object-cover" />
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
                  <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed hover-elevate" data-testid="label-banner-upload">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Загрузить баннер</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "banner")} data-testid="input-banner-upload" />
                  </label>
                )}
              </div>
            </div>

            {bannerUrl && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-semibold">Затемнение баннера</Label>
                  <p className="text-xs text-muted-foreground">Текст поверх баннера будет лучше виден</p>
                </div>
                <Switch
                  checked={bannerOverlay}
                  onCheckedChange={setBannerOverlay}
                  data-testid="switch-banner-overlay"
                />
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Стиль оформления</h2>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block text-sm font-semibold">Форма кнопок</Label>
                <div className="flex flex-wrap gap-2">
                  {BUTTON_STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setButtonStyle(s.value)}
                      className={`flex items-center gap-2 border px-4 py-2 text-sm font-medium transition-all ${s.preview} ${buttonStyle === s.value ? "ring-2 ring-offset-2 ring-foreground bg-foreground text-background" : "bg-muted"}`}
                      data-testid={`button-btn-style-${s.value}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-semibold">Стиль карточек товаров</Label>
                <div className="flex flex-wrap gap-2">
                  {CARD_STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setCardStyle(s.value)}
                      className={`rounded-md border px-4 py-2 text-sm font-medium transition-all ${cardStyle === s.value ? "ring-2 ring-offset-2 ring-foreground bg-foreground text-background" : "bg-muted"}`}
                      data-testid={`button-card-style-${s.value}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-semibold">Стиль шрифта</Label>
                <div className="flex flex-wrap gap-2">
                  {FONT_STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setFontStyle(s.value)}
                      className={`rounded-md border px-4 py-2 text-sm font-medium transition-all ${s.cls} ${fontStyle === s.value ? "ring-2 ring-offset-2 ring-foreground bg-foreground text-background" : "bg-muted"}`}
                      data-testid={`button-font-style-${s.value}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-foreground text-background rounded-full font-semibold"
            data-testid="button-save-branding"
          >
            {saveMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Предпросмотр магазина</p>
          <div className="overflow-hidden rounded-2xl border bg-background shadow-lg" style={{ maxWidth: 360 }}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
              <Menu className="h-4 w-4 text-muted-foreground" />
              <div className="w-4" />
              <div className="flex items-center gap-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="relative">
              <div className="mx-3 mt-2 overflow-hidden rounded-xl">
                <div
                  className="h-24 w-full"
                  style={{
                    background: bannerUrl
                      ? `url(${bannerUrl}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}08)`,
                  }}
                />
                {bannerUrl && bannerOverlay && (
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/30 rounded-xl" style={{ margin: "8px 12px 0 12px", height: "96px" }} />
                )}
              </div>
              <div className="flex flex-col items-center -mt-8 relative z-10">
                <Avatar className="h-16 w-16 border-4 border-background shadow-md">
                  {logoUrl ? (
                    <AvatarImage src={logoUrl} alt="Logo" />
                  ) : null}
                  <AvatarFallback
                    className="text-lg font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {(store?.name || "М").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className={`mt-1.5 text-sm font-bold tracking-tight ${fontStyle === "classic" ? "font-serif" : ""}`}>
                  {store?.name || "Ваш магазин"}
                </p>
                {store?.city && (
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5" /> {store.city}
                  </p>
                )}
              </div>
            </div>

            <div className="flex border-b border-border/30 mt-2">
              <div className="flex flex-1 items-center justify-center gap-1 border-b-2 border-foreground py-2 text-xs font-medium">
                {businessLabels.itemLabelPlural}
              </div>
              <div className="flex flex-1 items-center justify-center gap-1 py-2 text-xs font-medium text-muted-foreground">
                <Search className="h-3 w-3" /> Поиск
              </div>
            </div>

            <div className="flex gap-1.5 px-3 py-2.5">
              <span className="rounded-full px-3 py-1 text-[10px] font-medium text-white" style={{ backgroundColor: primaryColor }}>Все</span>
              <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium">Категория</span>
              <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium">Другая</span>
            </div>

            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
              {[
                { name: "Товар 1", price: "4 500 ₸", discount: "3 200 ₸" },
                { name: "Товар 2", price: "7 800 ₸", discount: null },
                { name: "Товар 3", price: "2 900 ₸", discount: null },
                { name: "Товар 4", price: "5 400 ₸", discount: "4 100 ₸" },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`overflow-hidden rounded-xl bg-card ${cardCls}`}
                >
                  <div className="relative aspect-square bg-muted">
                    <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground/20" />
                    {p.discount && (
                      <span
                        className="absolute top-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white"
                        style={{ backgroundColor: secondaryColor || primaryColor }}
                      >
                        -29%
                      </span>
                    )}
                    <button className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-white/90 shadow-sm">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className={`text-[11px] font-semibold leading-tight ${fontStyle === "classic" ? "font-serif" : ""}`}>{p.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {p.discount ? (
                        <>
                          <span className="text-[11px] font-bold" style={{ color: secondaryColor || primaryColor }}>{p.discount}</span>
                          <span className="text-[9px] text-muted-foreground line-through">{p.price}</span>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold">{p.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 pb-3">
              <div className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-white" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1 text-[9px] font-bold">
                    2
                  </span>
                  <span className="text-[11px] font-semibold">Корзина</span>
                </div>
                <span className="text-[11px] font-bold">11 000 ₸</span>
              </div>
            </div>

            <div className="border-t border-border/30 px-3 py-2 text-center">
              <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded bg-foreground">
                  <ShoppingBag className="h-2 w-2 text-background" />
                </div>
                <span>Сделано в <span className="font-semibold text-foreground">TakeSale</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
