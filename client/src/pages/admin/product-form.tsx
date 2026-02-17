import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBusinessLabels } from "@/hooks/use-business-labels";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ArrowLeft, Plus, Trash2, ImageIcon, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import type { Product, Category, Store, ProductVariantGroup } from "@shared/schema";

function getThumbUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    const filename = url.replace("/uploads/", "");
    return `/uploads/thumbs/${filename}`;
  }
  return url;
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
  variants: ProductVariantGroup[];
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", discountPrice: "", categoryId: "",
  isActive: true, imageUrls: [], sku: "", unit: "", attributes: {}, variants: [],
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
      {isFashion && (
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
            <Label className="text-xs text-muted-foreground">Оптовая цена</Label>
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
            <Label className="text-xs text-muted-foreground">{isHotel ? "Макс. гостей" : "Залоговая стоимость"}</Label>
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

export default function ProductFormPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const labels = useBusinessLabels();
  const isCreateMode = !params.id || params.id === "new";
  const productId = isCreateMode ? null : parseInt(params.id!);

  useDocumentTitle(isCreateMode ? "Новый продукт" : "Редактирование продукта");

  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({ queryKey: ["/api/my-store/products"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/my-store/categories"] });

  const businessType = store?.businessType || "ecommerce";
  const group = labels.group;

  const editProduct = productId ? products?.find((p) => p.id === productId) ?? null : null;

  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [initialized, setInitialized] = useState(false);
  const [showMorePricing, setShowMorePricing] = useState(false);
  const [attrsOpen, setAttrsOpen] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialized) return;
    if (isCreateMode) {
      setForm({ ...emptyForm });
      setInitialized(true);
    } else if (editProduct) {
      setForm({
        name: editProduct.name,
        description: editProduct.description || "",
        price: String(editProduct.price),
        discountPrice: editProduct.discountPrice ? String(editProduct.discountPrice) : "",
        categoryId: editProduct.categoryId ? String(editProduct.categoryId) : "",
        isActive: editProduct.isActive,
        imageUrls: editProduct.imageUrls || [],
        sku: (editProduct as any).sku || "",
        unit: (editProduct as any).unit || "",
        attributes: (editProduct as any).attributes || {},
        variants: (editProduct as any).variants || [],
      });
      setShowMorePricing(!!editProduct.discountPrice);
      setVariantsOpen(((editProduct as any).variants || []).length > 0);
      setInitialized(true);
    }
  }, [isCreateMode, editProduct, initialized]);

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
        variants: form.variants,
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
      toast({ title: editProduct ? "Сохранено" : "Добавлено" });
      navigate("/admin/products");
    },
    onError: (e: Error) => {
      let msg = e.message;
      try { const p = JSON.parse(msg.replace(/^\d+:\s*/, "")); if (p?.message) msg = p.message; } catch {}
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
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

  const addVariantGroup = () => {
    const newGroup: ProductVariantGroup = {
      id: crypto.randomUUID(),
      name: "",
      options: [],
    };
    setForm({ ...form, variants: [...form.variants, newGroup] });
    setVariantsOpen(true);
  };

  const removeVariantGroup = (groupId: string) => {
    setForm({ ...form, variants: form.variants.filter((g) => g.id !== groupId) });
  };

  const updateVariantGroupName = (groupId: string, name: string) => {
    setForm({
      ...form,
      variants: form.variants.map((g) => (g.id === groupId ? { ...g, name } : g)),
    });
  };

  const addVariantOption = (groupId: string) => {
    setForm({
      ...form,
      variants: form.variants.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: [
                ...g.options,
                { id: crypto.randomUUID(), label: "", price: null, imageUrl: null, sku: null, isActive: true },
              ],
            }
          : g
      ),
    });
  };

  const removeVariantOption = (groupId: string, optionId: string) => {
    setForm({
      ...form,
      variants: form.variants.map((g) =>
        g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g
      ),
    });
  };

  const updateVariantOption = (groupId: string, optionId: string, field: string, value: any) => {
    setForm({
      ...form,
      variants: form.variants.map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.map((o) => (o.id === optionId ? { ...o, [field]: value } : o)) }
          : g
      ),
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Введите название", variant: "destructive" });
      return;
    }
    if (!form.price || isNaN(parseInt(form.price)) || parseInt(form.price) < 0) {
      toast({ title: "Введите корректную цену", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const unitOptions = UNIT_OPTIONS[group] || UNIT_OPTIONS.ecommerce;

  const attrsSectionTitle = group === "fnb" ? "Параметры блюда" : group === "service" ? "Параметры услуги" : "Характеристики";

  if (!isCreateMode && productsLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isCreateMode && !editProduct && !productsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/products" data-testid="link-back-products">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Продукт не найден</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" data-testid="link-back-products">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold" data-testid="text-page-title">
          {isCreateMode ? "Новый продукт" : "Продукт"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4">
            <div>
              <Label data-testid="label-name">Имя</Label>
              <Input
                placeholder="Название продукта"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-product-name"
              />
            </div>

            <div>
              <Label data-testid="label-category">Категория</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? "" : v })}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Без категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без категории</SelectItem>
                  {(categories || []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label data-testid="label-sku">Артикул</Label>
                <Input
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  data-testid="input-sku"
                />
              </div>
              <div>
                <Label data-testid="label-weight">Вес</Label>
                <Input
                  placeholder="напр. 500г"
                  value={form.attributes.weight || ""}
                  onChange={(e) => setForm({ ...form, attributes: { ...form.attributes, weight: e.target.value } })}
                  data-testid="input-weight-main"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <Label className="text-sm font-semibold" data-testid="label-pricing-section">Ценообразование</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Цена</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  data-testid="input-price"
                />
              </div>
              {showMorePricing && (
                <div>
                  <Label className="text-xs text-muted-foreground">Скидочная цена</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    data-testid="input-discount-price"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMorePricing(!showMorePricing)}
              className="text-sm text-primary"
              data-testid="button-toggle-pricing"
            >
              {showMorePricing ? "Показать меньше" : "Показать больше"}
            </button>
          </div>

          <div>
            <Label data-testid="label-description">Описание</Label>
            <Textarea
              placeholder="Описание продукта. Поддерживается форматирование markdown."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              data-testid="input-description"
            />
          </div>

          <div className="space-y-3">
            <Label data-testid="label-images">Изображения</Label>
            <div
              className="rounded-lg border-2 border-dashed p-6 text-center hover-elevate cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              data-testid="area-image-upload"
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Нажмите или перетащите файлы для загрузки
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Файл не должен превышать 10 МБ. Максимум 5 изображений.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                data-testid="input-image-upload"
              />
            </div>

            {form.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {form.imageUrls.map((url, idx) => (
                  <div key={idx} className="group relative rounded-lg border" data-testid={`image-item-${idx}`}>
                    <img
                      src={getThumbUrl(url)}
                      alt=""
                      className="aspect-square w-full rounded-lg object-cover"
                      data-testid={`img-preview-${idx}`}
                    />
                    <div className="absolute right-1 top-1 flex gap-1" style={{ visibility: "visible" }}>
                      {idx > 0 && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6"
                          onClick={() => moveImage(idx, idx - 1)}
                          data-testid={`button-move-image-left-${idx}`}
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-6 w-6"
                        onClick={() => removeImage(idx)}
                        data-testid={`button-remove-image-${idx}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setVariantsOpen(!variantsOpen)}
              className="flex w-full items-center justify-between gap-2 p-3 text-sm font-semibold hover-elevate rounded-lg"
              data-testid="button-toggle-variants"
            >
              Варианты
              {variantsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {variantsOpen && (
              <div className="space-y-4 border-t px-3 pb-3 pt-3">
                {form.variants.map((vGroup) => (
                  <div key={vGroup.id} className="space-y-2 rounded-lg border p-3" data-testid={`variant-group-${vGroup.id}`}>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Название группы (напр. Размер, Цвет)"
                        value={vGroup.name}
                        onChange={(e) => updateVariantGroupName(vGroup.id, e.target.value)}
                        className="flex-1"
                        data-testid={`input-variant-group-name-${vGroup.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeVariantGroup(vGroup.id)}
                        data-testid={`button-delete-variant-group-${vGroup.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {vGroup.options.map((option) => (
                      <div key={option.id} className="flex items-center gap-2 pl-3" data-testid={`variant-option-${option.id}`}>
                        <Input
                          placeholder="Значение (напр. S, M, L)"
                          value={option.label}
                          onChange={(e) => updateVariantOption(vGroup.id, option.id, "label", e.target.value)}
                          className="flex-1"
                          data-testid={`input-variant-option-label-${option.id}`}
                        />
                        <Input
                          type="number"
                          placeholder="Цена"
                          value={option.price ?? ""}
                          onChange={(e) =>
                            updateVariantOption(vGroup.id, option.id, "price", e.target.value ? parseInt(e.target.value) : null)
                          }
                          className="w-24"
                          data-testid={`input-variant-option-price-${option.id}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeVariantOption(vGroup.id, option.id)}
                          data-testid={`button-delete-variant-option-${option.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addVariantOption(vGroup.id)}
                      className="ml-3"
                      data-testid={`button-add-variant-option-${vGroup.id}`}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Добавить вариант
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVariantGroup}
                  data-testid="button-add-variant-group"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Добавить группу вариантов
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save-product"
          >
            {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <Label className="text-sm font-semibold" data-testid="label-availability">Доступность</Label>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm" data-testid="label-visibility">Видимость</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                data-testid="switch-visibility"
              />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <Label className="text-sm font-semibold" data-testid="label-unit-section">Ед. измерения</Label>
            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v === "none" ? "" : v })}>
              <SelectTrigger data-testid="select-unit">
                <SelectValue placeholder="Не указана" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не указана</SelectItem>
                {unitOptions.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-4">
            <button
              type="button"
              onClick={() => setAttrsOpen(!attrsOpen)}
              className="flex w-full items-center justify-between gap-2 text-sm font-semibold"
              data-testid="button-toggle-attrs"
            >
              {attrsSectionTitle}
              {attrsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {attrsOpen && (
              <div className="space-y-3 mt-4">
                {group === "fnb" && <FnbFields form={form} setForm={setForm} />}
                {group === "ecommerce" && <EcommerceFields form={form} setForm={setForm} businessType={businessType} />}
                {group === "service" && <ServiceFields form={form} setForm={setForm} businessType={businessType} />}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}