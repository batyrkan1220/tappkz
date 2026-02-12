import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Eye, MousePointerClick, ShoppingCart, Package, FolderOpen, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
    { label: "Просмотры", value: analytics?.visits ?? 0, icon: Eye },
    { label: "В корзину", value: analytics?.addToCarts ?? 0, icon: ShoppingCart },
    { label: "Заказы WhatsApp", value: analytics?.checkouts ?? 0, icon: MousePointerClick },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Панель управления</h1>
        <p className="text-muted-foreground">Магазин: {store.name}</p>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm text-muted-foreground">Ваша витрина:</span>
        <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-sm" data-testid="text-store-url">
          {storeUrl}
        </code>
        <Button size="icon" variant="ghost" onClick={copyUrl} data-testid="button-copy-url">
          <Copy className="h-4 w-4" />
        </Button>
        <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer">
          <Button size="icon" variant="ghost" data-testid="button-open-store">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold" data-testid={`text-stat-${s.label}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Товары</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{products?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">
            Лимит: {store.plan === "free" ? 30 : store.plan === "pro" ? 300 : 2000}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Категории</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{categories?.length ?? 0}</p>
        </Card>
      </div>
    </div>
  );
}
