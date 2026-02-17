import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Search, ImageIcon, Package, FolderOpen, ArrowRight,
  AlertCircle, LayoutGrid, LayoutList, Copy,
  ArrowUpDown, EyeOff
} from "lucide-react";
import { LimitAlert, useUsageData } from "@/components/upgrade-banner";
import { useBusinessLabels } from "@/hooks/use-business-labels";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Link, useLocation } from "wouter";
import type { Product, Category, Store } from "@shared/schema";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-KZ").format(price) + " ₸";
}

function getThumbUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    const filename = url.replace("/uploads/", "");
    return `/uploads/thumbs/${filename}`;
  }
  return url;
}

function getAttrBadges(product: Product, group: string): string[] {
  const badges: string[] = [];
  const a = (product as any).attributes || {};
  if ((product as any).sku) badges.push(`Арт: ${(product as any).sku}`);
  if ((product as any).unit) badges.push((product as any).unit);
  if (a.brand) badges.push(a.brand);
  if (a.weight) badges.push(a.weight);
  if (a.sizes) badges.push(`Р: ${a.sizes}`);
  return badges;
}

type SortMode = "default" | "name" | "price_asc" | "price_desc";

export default function ProductsPage() {
  useDocumentTitle("Товары");
  const { toast } = useToast();
  const labels = useBusinessLabels();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: ["/api/my-store/products"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/my-store/categories"] });
  const { data: usage } = useUsageData();

  const hasCategories = (categories?.length ?? 0) > 0;
  const group = labels.group;

  const catMap = new Map<number, string>();
  (categories || []).forEach((c) => catMap.set(c.id, c.name));

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
        <Link href={hasCategories ? "/admin/products/new" : "#"}>
          <Button
            className="rounded-full font-semibold"
            disabled={!hasCategories}
            data-testid="button-add-product"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Добавить
          </Button>
        </Link>
      </div>

      {!hasCategories && (
        <Card className="flex items-center gap-3 p-4 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10" data-testid="card-no-categories-warning">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/30">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" data-testid="text-no-categories-title">Сначала создайте категорию</p>
            <p className="text-xs text-muted-foreground">
              Чтобы добавить товары, сначала создайте категории
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
              <Card
                key={p.id}
                className={`flex items-center gap-3 p-3 transition-opacity cursor-pointer hover-elevate ${!p.isActive ? "opacity-60" : ""}`}
                onClick={() => navigate(`/admin/products/${p.id}`)}
                data-testid={`card-product-${p.id}`}
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {p.imageUrls?.[0] ? (
                    <img src={getThumbUrl(p.imageUrls[0])} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
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
                    {(() => {
                      const variantOptions = ((p as any).variants || []).reduce((sum: number, g: any) => sum + (g.options?.length || 0), 0);
                      return variantOptions > 0 ? (
                        <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate" data-testid={`badge-product-variants-${p.id}`}>
                          {variantOptions} {variantOptions === 1 ? "вариант" : variantOptions < 5 ? "варианта" : "вариантов"}
                        </Badge>
                      ) : null;
                    })()}
                    {(p.imageUrls?.length || 0) > 1 && (
                      <span className="text-[10px] text-muted-foreground">{p.imageUrls!.length} фото</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, isActive: v })}
                    data-testid={`switch-product-active-${p.id}`}
                  />
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
              <Card
                key={p.id}
                className={`group overflow-hidden transition-opacity cursor-pointer ${!p.isActive ? "opacity-60" : ""}`}
                onClick={() => navigate(`/admin/products/${p.id}`)}
                data-testid={`card-product-${p.id}`}
              >
                <div className="relative aspect-square bg-muted">
                  {p.imageUrls?.[0] ? (
                    <img src={getThumbUrl(p.imageUrls[0])} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
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
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 invisible group-hover:visible" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}
