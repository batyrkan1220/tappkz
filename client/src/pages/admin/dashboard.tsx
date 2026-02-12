import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Eye, MousePointerClick, ShoppingCart, Package, FolderOpen, ExternalLink, Copy, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Store, Product, Category } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { data: store, isLoading } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: products } = useQuery<Product[]>({ queryKey: ["/api/my-store/products"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/my-store/categories"] });
  const { data: analytics } = useQuery<{ visits: number; checkouts: number; addToCarts: number }>({
    queryKey: ["/api/my-store/analytics"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!store) return null;

  const storeUrl = `${window.location.origin}/s/${store.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "Ссылка скопирована!" });
  };

  const stats = [
    { label: "Просмотры", value: analytics?.visits ?? 0, icon: Eye, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "В корзину", value: analytics?.addToCarts ?? 0, icon: ShoppingCart, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Заказы WhatsApp", value: analytics?.checkouts ?? 0, icon: MousePointerClick, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
  ];

  const productLimit = store.plan === "free" ? 30 : store.plan === "pro" ? 300 : 2000;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-dashboard-title">Панель управления</h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-dashboard-store">Магазин: {store.name}</p>
        </div>
        <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer" data-testid="link-view-store">
          <Button variant="outline" className="rounded-full font-semibold" data-testid="button-view-store">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Открыть витрину
          </Button>
        </a>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4" data-testid="card-store-url">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
          <Copy className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Ссылка на витрину</p>
          <code className="block truncate text-sm font-semibold" data-testid="text-store-url">{storeUrl}</code>
        </div>
        <Button variant="outline" className="rounded-full font-semibold" onClick={copyUrl} data-testid="button-copy-url">
          <Copy className="mr-1.5 h-4 w-4" />
          Копировать
        </Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5" data-testid={`card-stat-${s.label}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground" data-testid={`text-stat-label-${s.label}`}>{s.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight" data-testid={`text-stat-${s.label}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 hover-elevate" data-testid="card-products-summary">
          <Link href="/admin/products" className="block" data-testid="link-products-summary">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Товары</span>
                  <p className="text-2xl font-extrabold tracking-tight">{products?.length ?? 0}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Использовано</span>
                <span>{products?.length ?? 0} / {productLimit}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(((products?.length ?? 0) / productLimit) * 100, 100)}%` }} />
              </div>
            </div>
          </Link>
        </Card>

        <Card className="p-5 hover-elevate" data-testid="card-categories-summary">
          <Link href="/admin/categories" className="block" data-testid="link-categories-summary">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <FolderOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Категории</span>
                  <p className="text-2xl font-extrabold tracking-tight">{categories?.length ?? 0}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </Card>
      </div>

      {(products?.length ?? 0) === 0 && (
        <Card className="p-6 text-center border-dashed" data-testid="card-empty-state">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/30">
            <Package className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="font-extrabold tracking-tight" data-testid="text-empty-title">Начните с добавления товаров</h3>
          <p className="mt-1 text-sm text-muted-foreground">Добавьте товары, чтобы ваша витрина заработала</p>
          <div className="mt-4">
            <Link href="/admin/products" data-testid="link-go-products">
              <Button className="bg-green-600 text-white rounded-full font-semibold" data-testid="button-go-products">
                <Package className="mr-1.5 h-4 w-4" />
                Добавить товары
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
