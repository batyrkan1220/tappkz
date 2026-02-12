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
import { Plus, Pencil, Trash2, Search, ImageIcon, Package, FolderOpen, ArrowRight, AlertCircle } from "lucide-react";
import { useBusinessLabels } from "@/hooks/use-business-labels";
import { Link } from "wouter";
import type { Product, Category, Store } from "@shared/schema";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-KZ").format(price) + " ₸";
}

export default function ProductsPage() {
  const { toast } = useToast();
  const labels = useBusinessLabels();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: ["/api/my-store/products"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/my-store/categories"] });

  const hasCategories = (categories?.length ?? 0) > 0;

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    categoryId: "",
    isActive: true,
    imageUrls: [] as string[],
  });

  const openCreate = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", price: "", discountPrice: "", categoryId: "", isActive: true, imageUrls: [] });
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
      };
      if (editProduct) {
        await apiRequest("PATCH", `/api/my-store/products/${editProduct.id}`, body);
      } else {
        await apiRequest("POST", "/api/my-store/products", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/products"] });
      setDialogOpen(false);
      toast({ title: editProduct ? `${labels.itemLabelPlural} обновлён` : `${labels.itemLabelPlural} создан` });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
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
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...data.urls] }));
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    }
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }));
  };

  const filtered = (products || [])
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => filterCat === "all" || String(p.categoryId) === filterCat);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/30">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-products-title">{labels.itemLabelPlural}</h1>
            <p className="text-xs text-muted-foreground" data-testid="text-products-count">{products?.length ?? 0} позиций</p>
          </div>
        </div>
        <Button
          onClick={hasCategories ? openCreate : undefined}
          className="bg-green-600 text-white rounded-full font-semibold"
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
              {labels.group === "fnb" ? "Чтобы добавить блюда, сначала создайте разделы меню" : labels.group === "service" ? "Чтобы добавить услуги, сначала создайте категории услуг" : "Чтобы добавить товары, сначала создайте категории"}
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

      {hasCategories && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]" data-testid="container-search-products">
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
            <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {(categories || []).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filtered.length === 0 && hasCategories ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed" data-testid="card-empty-products">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/30">
            <Package className="h-7 w-7 text-green-600" />
          </div>
          <p className="font-extrabold tracking-tight">Нет позиций</p>
          <p className="mt-1 text-sm text-muted-foreground">Добавьте первую позицию в каталог</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-3" data-testid={`card-product-${p.id}`}>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {p.imageUrls?.[0] ? (
                  <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold" data-testid={`text-product-name-${p.id}`}>{p.name}</p>
                  {!p.isActive && <Badge variant="secondary">Скрыт</Badge>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {p.discountPrice ? (
                    <>
                      <span className="font-semibold text-green-600">{formatPrice(p.discountPrice)}</span>
                      <span className="text-muted-foreground line-through">{formatPrice(p.price)}</span>
                    </>
                  ) : (
                    <span className="font-semibold">{formatPrice(p.price)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={p.isActive}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, isActive: v })}
                  data-testid={`switch-product-active-${p.id}`}
                />
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-product-${p.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
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
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-product-name" />
            </div>
            <div>
              <Label className="font-semibold">Описание</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-product-description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-semibold">Цена (₸) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="input-product-price" />
              </div>
              <div>
                <Label className="font-semibold">Скидочная цена (₸)</Label>
                <Input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} data-testid="input-product-discount" />
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
            <div>
              <Label className="font-semibold">Фото</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {form.imageUrls.map((url, i) => (
                  <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                {form.imageUrls.length < 5 && (
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed hover-elevate">
                    <Plus className="h-5 w-5 text-muted-foreground" />
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
              className="w-full bg-green-600 text-white rounded-full font-semibold"
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
