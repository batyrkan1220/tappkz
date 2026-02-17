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
import { ArrowLeft, Plus, Trash2, ImageIcon, Upload, ChevronDown, ChevronUp, Download, Package } from "lucide-react";
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
  productType: "physical" | "digital";
  downloadUrl: string;
  attributes: ProductAttributes;
  variants: ProductVariantGroup[];
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", discountPrice: "", categoryId: "",
  isActive: true, imageUrls: [], sku: "", unit: "", productType: "physical",
  downloadUrl: "", attributes: {}, variants: [],
};

const UNIT_OPTIONS: Record<string, { value: string; label: string }[]> = {
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
};

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

  const group = labels.group;

  const editProduct = productId ? products?.find((p) => p.id === productId) ?? null : null;

  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [initialized, setInitialized] = useState(false);
  const [showMorePricing, setShowMorePricing] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
        productType: (editProduct as any).productType === "digital" ? "digital" : "physical",
        downloadUrl: (editProduct as any).downloadUrl || "",
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
      const body: Record<string, any> = {
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
        productType: form.productType,
        downloadUrl: form.productType === "digital" ? (form.downloadUrl || null) : null,
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

  const validateForm = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Обязательное поле";
    if (!form.price || isNaN(parseInt(form.price)) || parseInt(form.price) < 0) errs.price = "Введите корректную цену";
    if (form.productType === "digital" && !form.downloadUrl.trim()) errs.downloadUrl = "Укажите ссылку для скачивания";
    return errs;
  };

  const handleSave = () => {
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const unitOptions = UNIT_OPTIONS[group] || UNIT_OPTIONS.ecommerce;


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
              <Label data-testid="label-name" className={errors.name ? "text-destructive" : ""}>Имя *</Label>
              <Input
                placeholder="Название продукта"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors((prev) => { const n = { ...prev }; delete n.name; return n; }); }}
                className={errors.name ? "border-destructive" : ""}
                data-testid="input-product-name"
              />
              {errors.name && <p className="text-xs text-destructive mt-1" data-testid="error-name">{errors.name}</p>}
            </div>

            <div>
              <Label data-testid="label-product-type">Тип продукта</Label>
              <Select value={form.productType} onValueChange={(v: "physical" | "digital") => setForm({ ...form, productType: v })}>
                <SelectTrigger data-testid="select-product-type">
                  <SelectValue placeholder="Тип продукта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">
                    <span className="flex items-center gap-2"><Package className="h-4 w-4" /> Физический товар</span>
                  </SelectItem>
                  <SelectItem value="digital">
                    <span className="flex items-center gap-2"><Download className="h-4 w-4" /> Цифровой товар</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.productType === "digital" && (
              <div className={`rounded-lg border p-4 space-y-3 ${errors.downloadUrl ? "border-destructive" : ""}`}>
                <Label className="text-sm font-semibold" data-testid="label-digital-section">Цифровой товар</Label>
                <div>
                  <Label className={`text-xs ${errors.downloadUrl ? "text-destructive" : "text-muted-foreground"}`}>Ссылка для скачивания *</Label>
                  <Input
                    placeholder="https://example.com/file.zip"
                    value={form.downloadUrl}
                    onChange={(e) => { setForm({ ...form, downloadUrl: e.target.value }); if (errors.downloadUrl) setErrors((prev) => { const n = { ...prev }; delete n.downloadUrl; return n; }); }}
                    className={errors.downloadUrl ? "border-destructive" : ""}
                    data-testid="input-download-url"
                  />
                  {errors.downloadUrl ? <p className="text-xs text-destructive mt-1" data-testid="error-download-url">{errors.downloadUrl}</p> : <p className="text-xs text-muted-foreground mt-1">Покупатель получит эту ссылку после оплаты</p>}
                </div>
              </div>
            )}

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

            {form.productType === "physical" && (
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
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <Label className="text-sm font-semibold" data-testid="label-pricing-section">Ценообразование</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className={`text-xs ${errors.price ? "text-destructive" : "text-muted-foreground"}`}>Цена *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => { setForm({ ...form, price: e.target.value }); if (errors.price) setErrors((prev) => { const n = { ...prev }; delete n.price; return n; }); }}
                  className={errors.price ? "border-destructive" : ""}
                  data-testid="input-price"
                />
                {errors.price && <p className="text-xs text-destructive mt-1" data-testid="error-price">{errors.price}</p>}
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

        </div>
      </div>
    </div>
  );
}