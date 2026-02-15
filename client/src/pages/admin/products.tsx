import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Search, ImageIcon, Package, FolderOpen, ArrowRight,
  AlertCircle, ChevronDown, ChevronUp, LayoutGrid, LayoutList, Copy,
  ArrowUpDown, EyeOff
} from "lucide-react";
import { LimitAlert, useUsageData } from "@/components/upgrade-banner";
import { useBusinessLabels } from "@/hooks/use-business-labels";
import { Link } from "wouter";
import type { Product, Category, Store } from "@shared/schema";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-KZ").format(price) + " \u20B8";
}

type ProductAttributes = Record<string, any>;

interface ProductForm {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  categoryId: string;
  isActive: boolean;
  imageUrls: string[];
  sku: string;
  unit: string;
  attributes: ProductAttributes;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", discountPrice: "", categoryId: "",
  isActive: true, imageUrls: [], sku: "", unit: "", attributes: {},
};

const UNIT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  fnb: [
    { value: "порция", label: "Порция" },
    { value: "шт", label: "Штука" },
    { value: "г", label: "Граммы (г)" },
    { value: "кг", label: "Килограммы (кг)" },
    { value: "мл", label: "Миллилитры (мл)" },
    { value: "л", label: "Литры (л)" },
  ],
  ecommerce: [
    { value: "шт", label: "Штука" },
    { value: "г", label: "Граммы (г)" },
    { value: "кг", label: "Килограммы (кг)" },
    { value: "мл", label: "Миллилитры (мл)" },
    { value: "л", label: "Литры (л)" },
    { value: "м", label: "Метры (м)" },
    { value: "уп", label: "Упаковка" },
    { value: "компл", label: "Комплект" },
  ],
  service: [
    { value: "услуга", label: "Услуга" },
    { value: "час", label: "Час" },
    { value: "сеанс", label: "Сеанс" },
    { value: "занятие", label: "Занятие" },
    { value: "день", label: "День" },
    { value: "чел", label: "Человек" },
  ],
};

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 p-3 text-sm font-semibold hover-elevate rounded-lg"
        data-testid={`section-toggle-${title.replace(/\s/g, '-')}`}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="space-y-3 border-t px-3 pb-3 pt-3">{children}</div>}
    </div>
  );
}

function FnbFields({ form, setForm }: { form: ProductForm; setForm: (f: ProductForm) => void }) {
  const a = form.attributes;
  const setAttr = (key: string, val: any) => setForm({ ...form, attributes: { ...a, [key]: val } });
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Размер порции</Label>
          <Input placeholder="напр. 250г" value={a.portionSize || ""} onChange={(e) => setAttr("portionSize", e.target.value)} data-testid="input-portion-size" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Калории (ккал)</Label>
          <Input type="number" placeholder="0" value={a.calories || ""} onChange={(e) => setAttr("calories", e.target.value)} data-testid="input-calories" />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Время приготовления (мин)</Label>
        <Input type="number" placeholder="0" value={a.cookingTime || ""} onChange={(e) => setAttr("cookingTime", e.target.value)} data-testid="input-cooking-time" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Состав / ингредиенты</Label>
        <Textarea placeholder="Перечислите ингредиенты" value={a.ingredients || ""} onChange={(e) => setAttr("ingredients", e.target.value)} data-testid="input-ingredients" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Аллергены</Label>
        <Input placeholder="напр. молоко, орехи, глютен" value={a.allergens || ""} onChange={(e) => setAttr("allergens", e.target.value)} data-testid="input-allergens" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={!!a.isSpicy} onCheckedChange={(v) => setAttr("isSpicy", v)} data-testid="switch-spicy" />
          <Label className="text-xs">Острое</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={!!a.isVegetarian} onCheckedChange={(v) => setAttr("isVegetarian", v)} data-testid="switch-vegetarian" />
          <Label className="text-xs">Вегетарианское</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={!!a.isHalal} onCheckedChange={(v) => setAttr("isHalal", v)} data-testid="switch-halal" />
          <Label className="text-xs">Халяль</Label>
        </div>
      </div>
    </>
  );
}

function EcommerceFields({ form, setForm, businessType }: { form: ProductForm; setForm: (f: ProductForm) => void; businessType: string }) {
  const a = form.attributes;
  const setAttr = (key: string, val: any) => setForm({ ...form, attributes: { ...a, [key]: val } });
  const isFashion = businessType === "fashion" || businessType === "jewelry";
  const isPharmacy = businessType === "pharmacy";
  const isDigital = businessType === "digital";
  const isB2B = businessType === "b2b";
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Бренд</Label>
          <Input placeholder="Название бренда" value={a.brand || ""} onChange={(e) => setAttr("brand", e.target.value)} data-testid="input-brand" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Вес</Label>
          <Input placeholder="напр. 500г" value={a.weight || ""} onChange={(e) => setAttr("weight", e.target.value)} data-testid="input-weight" />
        </div>
      </div>
      {!isDigital && (
        <div>
          <Label className="text-xs text-muted-foreground">Материал</Label>
          <Input placeholder="Материал изделия" value={a.material || ""} onChange={(e) => setAttr("material", e.target.value)} data-testid="input-material" />
        </div>
      )}
      {(isFashion) && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Размеры (через запятую)</Label>
            <Input placeholder="XS, S, M, L, XL, XXL" value={a.sizes || ""} onChange={(e) => setAttr("sizes", e.target.value)} data-testid="input-sizes" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Цвета (через запятую)</Label>
            <Input placeholder="Черный, Белый, Красный" value={a.colors || ""} onChange={(e) => setAttr("colors", e.target.value)} data-testid="input-colors" />
          </div>
        </>
      )}
      {!isDigital && !isFashion && (
        <div>
          <Label className="text-xs text-muted-foreground">Габариты (Д x Ш x В)</Label>
          <Input placeholder="напр. 30x20x10 см" value={a.dimensions || ""} onChange={(e) => setAttr("dimensions", e.target.value)} data-testid="input-dimensions" />
        </div>
      )}
      {!isDigital && (
        <div>
          <Label className="text-xs text-muted-foreground">Гарантия (мес)</Label>
          <Input type="number" placeholder="0" value={a.warrantyMonths || ""} onChange={(e) => setAttr("warrantyMonths", e.target.value)} data-testid="input-warranty" />
        </div>
      )}
      {isPharmacy && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Дозировка</Label>
            <Input placeholder="напр. 500мг" value={a.dosage || ""} onChange={(e) => setAttr("dosage", e.target.value)} data-testid="input-dosage" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Действующее вещество</Label>
            <Input placeholder="Активный ингредиент" value={a.activeIngredient || ""} onChange={(e) => setAttr("activeIngredient", e.target.value)} data-testid="input-active-ingredient" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!a.prescriptionRequired} onCheckedChange={(v) => setAttr("prescriptionRequired", v)} data-testid="switch-prescription" />
            <Label className="text-xs">По рецепту</Label>
          </div>
        </>
      )}
      {isDigital && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Формат файла</Label>
            <Input placeholder="напр. PDF, MP4, ZIP" value={a.fileFormat || ""} onChange={(e) => setAttr("fileFormat", e.target.value)} data-testid="input-file-format" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Способ доставки</Label>
            <Select value={a.deliveryMethod || ""} onValueChange={(v) => setAttr("deliveryMethod", v)}>
              <SelectTrigger data-testid="select-delivery-method">
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="download">Скачивание</SelectItem>
                <SelectItem value="email">По Email</SelectItem>
                <SelectItem value="link">По ссылке</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      {isB2B && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Мин. кол-во заказа</Label>
            <Input type="number" placeholder="1" value={a.minOrderQty || ""} onChange={(e) => setAttr("minOrderQty", e.target.value)} data-testid="input-min-order" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Оптовая цена (\u20B8)</Label>
            <Input type="number" placeholder="0" value={a.wholesalePrice || ""} onChange={(e) => setAttr("wholesalePrice", e.target.value)} data-testid="input-wholesale-price" />
          </div>
        </>
      )}
    </>
  );
}

function ServiceFields({ form, setForm, businessType }: { form: ProductForm; setForm: (f: ProductForm) => void; businessType: string }) {
  const a = form.attributes;
  const setAttr = (key: string, val: any) => setForm({ ...form, attributes: { ...a, [key]: val } });
  const isEducation = businessType === "education";
  const isTravel = businessType === "travel";
  const isTicketing = businessType === "ticketing";
  const isHotel = businessType === "hotel";
  const isRental = businessType === "rental";
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Длительность (мин)</Label>
          <Input type="number" placeholder="60" value={a.durationMinutes || ""} onChange={(e) => setAttr("durationMinutes", e.target.value)} data-testid="input-duration" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Тип цены</Label>
          <Select value={a.priceType || "fixed"} onValueChange={(v) => setAttr("priceType", v)}>
            <SelectTrigger data-testid="select-price-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Фиксированная</SelectItem>
              <SelectItem value="from">От (минимальная)</SelectItem>
              <SelectItem value="hourly">Почасовая</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Место оказания</Label>
        <Select value={a.serviceLocation || ""} onValueChange={(v) => setAttr("serviceLocation", v)}>
          <SelectTrigger data-testid="select-service-location">
            <SelectValue placeholder="Выберите" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="onsite">У нас</SelectItem>
            <SelectItem value="client">У клиента</SelectItem>
            <SelectItem value="online">Онлайн</SelectItem>
            <SelectItem value="any">Любое</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={!!a.bookingRequired} onCheckedChange={(v) => setAttr("bookingRequired", v)} data-testid="switch-booking" />
        <Label className="text-xs">Требуется предварительная запись</Label>
      </div>
      {isEducation && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Формат обучения</Label>
            <Select value={a.format || ""} onValueChange={(v) => setAttr("format", v)}>
              <SelectTrigger data-testid="select-education-format">
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offline">Очно</SelectItem>
                <SelectItem value="online">Онлайн</SelectItem>
                <SelectItem value="hybrid">Гибрид</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Кол-во занятий</Label>
            <Input type="number" placeholder="1" value={a.lessonsCount || ""} onChange={(e) => setAttr("lessonsCount", e.target.value)} data-testid="input-lessons-count" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!a.certificate} onCheckedChange={(v) => setAttr("certificate", v)} data-testid="switch-certificate" />
            <Label className="text-xs">Выдаётся сертификат</Label>
          </div>
        </>
      )}
      {(isTravel || isTicketing) && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">{isTravel ? "Направление" : "Место проведения"}</Label>
            <Input placeholder={isTravel ? "напр. Стамбул, Анталья" : "напр. Алматы Арена"} value={a.location || ""} onChange={(e) => setAttr("location", e.target.value)} data-testid="input-location" />
          </div>
          {isTravel && (
            <div>
              <Label className="text-xs text-muted-foreground">Кол-во дней</Label>
              <Input type="number" placeholder="1" value={a.daysCount || ""} onChange={(e) => setAttr("daysCount", e.target.value)} data-testid="input-days-count" />
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Макс. участников</Label>
            <Input type="number" placeholder="" value={a.maxParticipants || ""} onChange={(e) => setAttr("maxParticipants", e.target.value)} data-testid="input-max-participants" />
          </div>
        </>
      )}
      {(isHotel || isRental) && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">{isHotel ? "Макс. гостей" : "Залоговая стоимость (\u20B8)"}</Label>
            <Input type="number" placeholder="" value={isHotel ? (a.maxGuests || "") : (a.depositAmount || "")} onChange={(e) => setAttr(isHotel ? "maxGuests" : "depositAmount", e.target.value)} data-testid={`input-${isHotel ? "max-guests" : "deposit"}`} />
          </div>
          {isRental && (
            <div>
              <Label className="text-xs text-muted-foreground">Период аренды</Label>
              <Select value={a.rentalPeriod || ""} onValueChange={(v) => setAttr("rentalPeriod", v)}>
                <SelectTrigger data-testid="select-rental-period">
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Час</SelectItem>
                  <SelectItem value="day">День</SelectItem>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </>
  );
}

function getAttrBadges(product: Product, group: string): string[] {
  const badges: string[] = [];
  const a = (product as any).attributes || {};
  if ((product as any).sku) badges.push(`Арт: ${(product as any).sku}`);
  if ((product as any).unit) badges.push((product as any).unit);
  if (group === "fnb") {
    if (a.portionSize) badges.push(a.portionSize);
    if (a.calories) badges.push(`${a.calories} ккал`);
    if (a.isSpicy) badges.push("Острое");
    if (a.isVegetarian) badges.push("Вег");
    if (a.isHalal) badges.push("Халяль");
  }
  if (group === "ecommerce") {
    if (a.brand) badges.push(a.brand);
    if (a.weight) badges.push(a.weight);
    if (a.sizes) badges.push(`Р: ${a.sizes}`);
  }
  if (group === "service") {
    if (a.durationMinutes) badges.push(`${a.durationMinutes} мин`);
    if (a.priceType === "from") badges.push("от");
    if (a.bookingRequired) badges.push("Запись");
  }
  return badges;
}

type SortMode = "default" | "name" | "price_asc" | "price_desc";

export default function ProductsPage() {
  const { toast } = useToast();
  const labels = useBusinessLabels();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: ["/api/my-store/products"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/my-store/categories"] });
  const { data: usage } = useUsageData();

  const hasCategories = (categories?.length ?? 0) > 0;
  const businessType = store?.businessType || "ecommerce";
  const group = labels.group;

  const [form, setForm] = useState<ProductForm>({ ...emptyForm });

  const catMap = new Map<number, string>();
  (categories || []).forEach((c) => catMap.set(c.id, c.name));

  const openCreate = () => {
    setEditProduct(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      isActive: p.isActive,
      imageUrls: p.imageUrls || [],
      sku: (p as any).sku || "",
      unit: (p as any).unit || "",
      attributes: (p as any).attributes || {},
    });
    setDialogOpen(true);
  };

  const duplicateProduct = (p: Product) => {
    setEditProduct(null);
    setForm({
      name: p.name + " (копия)",
      description: p.description || "",
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      isActive: p.isActive,
      imageUrls: p.imageUrls || [],
      sku: "",
      unit: (p as any).unit || "",
      attributes: (p as any).attributes || {},
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name,
        description: form.description || null,
        price: parseInt(form.price),
        discountPrice: form.discountPrice ? parseInt(form.discountPrice) : null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        isActive: form.isActive,
        imageUrls: form.imageUrls,
        storeId: store!.id,
        sortOrder: editProduct?.sortOrder ?? 0,
        sku: form.sku || null,
        unit: form.unit || null,
        attributes: form.attributes,
      };
      if (editProduct) {
        await apiRequest("PATCH", `/api/my-store/products/${editProduct.id}`, body);
      } else {
        await apiRequest("POST", "/api/my-store/products", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/usage"] });
      setDialogOpen(false);
      toast({ title: editProduct ? "Сохранено" : "Добавлено" });
    },
    onError: (e: Error) => {
      let msg = e.message;
      try { const p = JSON.parse(msg.replace(/^\d+:\s*/, "")); if (p?.message) msg = p.message; } catch {}
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/my-store/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/products"] });
      toast({ title: "Удалено" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/my-store/products/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/products"] });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        let msg = "Ошибка загрузки";
        try { const p = JSON.parse(text); if (p?.message) msg = p.message; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...data.urls] }));
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/usage"] });
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err?.message || "", variant: "destructive" });
    }
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= form.imageUrls.length) return;
    setForm((prev) => {
      const urls = [...prev.imageUrls];
      const [item] = urls.splice(from, 1);
      urls.splice(to, 0, item);
      return { ...prev, imageUrls: urls };
    });
  };

  let filtered = (products || [])
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => filterCat === "all" || String(p.categoryId) === filterCat);

  if (sortMode === "name") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  } else if (sortMode === "price_asc") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortMode === "price_desc") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  }

  const activeCount = (products || []).filter(p => p.isActive).length;
  const inactiveCount = (products || []).filter(p => !p.isActive).length;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const unitOptions = UNIT_OPTIONS[group] || UNIT_OPTIONS.ecommerce;
  const sectionTitle = group === "fnb" ? "Параметры блюда" : group === "service" ? "Параметры услуги" : "Характеристики";

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/5">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-products-title">{labels.itemLabelPlural}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" data-testid="text-products-count">
              <span>{products?.length ?? 0} всего</span>
              {activeCount > 0 && <span className="text-green-600">{activeCount} активных</span>}
              {inactiveCount > 0 && <span className="text-muted-foreground">{inactiveCount} скрытых</span>}
            </div>
          </div>
        </div>
        <Button
          onClick={hasCategories ? openCreate : undefined}
          className="rounded-full font-semibold"
          disabled={!hasCategories}
          data-testid="button-add-product"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Добавить
        </Button>
      </div>

      {!hasCategories && (
        <Card className="flex items-center gap-3 p-4 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10" data-testid="card-no-categories-warning">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/30">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" data-testid="text-no-categories-title">Сначала создайте категорию</p>
            <p className="text-xs text-muted-foreground">
              {group === "fnb" ? "Чтобы добавить блюда, сначала создайте разделы меню" : group === "service" ? "Чтобы добавить услуги, сначала создайте категории услуг" : "Чтобы добавить товары, сначала создайте категории"}
            </p>
          </div>
          <Link href="/admin/categories" data-testid="link-go-categories">
            <Button className="bg-amber-600 text-white rounded-full font-semibold" data-testid="button-go-categories">
              <FolderOpen className="mr-1.5 h-4 w-4" />
              Создать
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      )}

      {usage && usage.plan === "free" && (
        <LimitAlert type="products" current={usage.products} limit={usage.productLimit} />
      )}

      {hasCategories && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]" data-testid="container-search-products">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-products"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[160px]" data-testid="select-filter-category">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {(categories || []).map((c) => {
                const count = (products || []).filter(p => p.categoryId === c.id).length;
                return (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[150px]" data-testid="select-sort-products">
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">По умолчанию</SelectItem>
              <SelectItem value="name">По названию</SelectItem>
              <SelectItem value="price_asc">Цена: сначала дешёвые</SelectItem>
              <SelectItem value="price_desc">Цена: сначала дорогие</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border">
            <Button
              size="icon"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
              data-testid="button-view-list"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === "grid" ? "default" : "ghost"}
              onClick={() => setViewMode("grid")}
              className="rounded-l-none"
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 && hasCategories ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed" data-testid="card-empty-products">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/5">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <p className="font-extrabold tracking-tight">Нет позиций</p>
          <p className="mt-1 text-sm text-muted-foreground">Добавьте первую позицию в каталог</p>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {filtered.map((p) => {
            const badges = getAttrBadges(p, group);
            const catName = p.categoryId ? catMap.get(p.categoryId) : null;
            return (
              <Card key={p.id} className={`flex items-center gap-3 p-3 transition-opacity ${!p.isActive ? "opacity-60" : ""}`} data-testid={`card-product-${p.id}`}>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {p.imageUrls?.[0] ? (
                    <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold leading-tight" data-testid={`text-product-name-${p.id}`}>{p.name}</p>
                    {!p.isActive && <Badge variant="secondary" className="text-[10px]"><EyeOff className="mr-1 h-3 w-3" />Скрыт</Badge>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {p.discountPrice ? (
                      <>
                        <span className="text-sm font-bold text-green-600" data-testid={`text-product-price-${p.id}`}>{formatPrice(p.discountPrice)}</span>
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</span>
                        <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 no-default-hover-elevate no-default-active-elevate">
                          -{p.price > 0 ? Math.round((1 - p.discountPrice / p.price) * 100) : 0}%
                        </Badge>
                      </>
                    ) : (
                      <span className="text-sm font-bold" data-testid={`text-product-price-${p.id}`}>{formatPrice(p.price)}</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {catName && (
                      <Badge variant="outline" className="text-[10px] no-default-hover-elevate no-default-active-elevate" data-testid={`badge-product-category-${p.id}`}>
                        <FolderOpen className="mr-1 h-2.5 w-2.5" />{catName}
                      </Badge>
                    )}
                    {badges.map((b, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">{b}</Badge>
                    ))}
                    {(p.imageUrls?.length || 0) > 1 && (
                      <span className="text-[10px] text-muted-foreground">{p.imageUrls!.length} фото</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, isActive: v })}
                    data-testid={`switch-product-active-${p.id}`}
                  />
                  <Button size="icon" variant="ghost" onClick={() => duplicateProduct(p)} title="Дублировать" data-testid={`button-duplicate-product-${p.id}`}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-product-${p.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((p) => {
            const catName = p.categoryId ? catMap.get(p.categoryId) : null;
            return (
              <Card key={p.id} className={`group overflow-hidden transition-opacity ${!p.isActive ? "opacity-60" : ""}`} data-testid={`card-product-${p.id}`}>
                <div className="relative aspect-square bg-muted">
                  {p.imageUrls?.[0] ? (
                    <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  {p.discountPrice && (
                    <Badge className="absolute left-1.5 top-1.5 bg-green-600 text-white text-[10px] no-default-hover-elevate no-default-active-elevate">
                      -{p.price > 0 ? Math.round((1 - p.discountPrice / p.price) * 100) : 0}%
                    </Badge>
                  )}
                  {!p.isActive && (
                    <Badge variant="secondary" className="absolute right-1.5 top-1.5 text-[10px] no-default-hover-elevate no-default-active-elevate">
                      <EyeOff className="mr-1 h-3 w-3" />Скрыт
                    </Badge>
                  )}
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 invisible group-hover:visible">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => duplicateProduct(p)} data-testid={`button-duplicate-product-${p.id}`}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-product-${p.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-semibold leading-tight" data-testid={`text-product-name-${p.id}`}>{p.name}</p>
                  {catName && (
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground" data-testid={`badge-product-category-${p.id}`}>{catName}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {p.discountPrice ? (
                      <>
                        <span className="text-sm font-bold text-green-600">{formatPrice(p.discountPrice)}</span>
                        <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.price)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold">{formatPrice(p.price)}</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-extrabold tracking-tight">{editProduct ? "Редактировать" : "Добавить"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-semibold">Название *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Введите название" data-testid="input-product-name" />
            </div>
            <div>
              <Label className="font-semibold">Описание</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Краткое описание товара" data-testid="input-product-description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-semibold">Цена (\u20B8) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" data-testid="input-product-price" />
              </div>
              <div>
                <Label className="font-semibold">Скидочная цена (\u20B8)</Label>
                <Input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} placeholder="Необязательно" data-testid="input-product-discount" />
              </div>
            </div>
            <div>
              <Label className="font-semibold">{labels.categoryLabel}</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger data-testid="select-product-category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {(categories || []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-semibold">Артикул (SKU)</Label>
                <Input placeholder="напр. А-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} data-testid="input-product-sku" />
              </div>
              <div>
                <Label className="font-semibold">Ед. измерения</Label>
                <Select value={form.unit || ""} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger data-testid="select-product-unit">
                    <SelectValue placeholder="Выберите" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CollapsibleSection title={sectionTitle} defaultOpen={editProduct != null && Object.keys(form.attributes).length > 0}>
              {group === "fnb" && <FnbFields form={form} setForm={setForm} />}
              {group === "ecommerce" && <EcommerceFields form={form} setForm={setForm} businessType={businessType} />}
              {group === "service" && <ServiceFields form={form} setForm={setForm} businessType={businessType} />}
            </CollapsibleSection>

            <div>
              <Label className="font-semibold">Фото</Label>
              <p className="mb-1.5 text-xs text-muted-foreground">Первое фото будет обложкой. Перетащите для изменения порядка.</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {form.imageUrls.map((url, i) => (
                  <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border" data-testid={`image-preview-${i}`}>
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {i === 0 && form.imageUrls.length > 1 && (
                      <span className="absolute left-0 top-0 rounded-br-md bg-foreground/80 px-1.5 py-0.5 text-[8px] font-bold text-background">
                        Обложка
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 invisible group-hover:visible">
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(i, i - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs"
                          data-testid={`button-move-image-left-${i}`}
                        >
                          ←
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                        data-testid={`button-remove-image-${i}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {i < form.imageUrls.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(i, i + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs"
                          data-testid={`button-move-image-right-${i}`}
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {form.imageUrls.length < 5 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed hover-elevate" data-testid="label-product-image-upload">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">{form.imageUrls.length}/5</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} data-testid="input-product-images" />
                  </label>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-product-active" />
              <Label className="font-semibold">В наличии</Label>
            </div>
            <Button
              className="w-full rounded-full font-semibold"
              onClick={() => saveMutation.mutate()}
              disabled={!form.name || !form.price || saveMutation.isPending}
              data-testid="button-save-product"
            >
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
