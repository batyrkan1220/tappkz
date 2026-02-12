import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Store, Users, ShoppingCart, Package, DollarSign, UserCheck, BarChart3 } from "lucide-react";
import { BUSINESS_TYPES } from "@shared/schema";
import { Link } from "wouter";

interface PlatformAnalytics {
  totalStores: number;
  activeStores: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  storesByPlan: { plan: string; count: number }[];
  storesByType: { type: string; count: number }[];
  recentStores: { id: number; name: string; slug: string; plan: string; businessType: string | null; isActive: boolean; createdAt: string | null }[];
}

const planLabels: Record<string, string> = { free: "Free", pro: "Pro", business: "Business" };
const planColors: Record<string, string> = {
  free: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  business: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery<PlatformAnalytics>({ queryKey: ["/api/superadmin/analytics"] });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Магазины", value: data.totalStores, sub: `${data.activeStores} активных`, icon: Store, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Пользователи", value: data.totalUsers, icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Заказы", value: data.totalOrders, icon: ShoppingCart, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Выручка", value: `${(data.totalRevenue || 0).toLocaleString("ru-RU")} ₸`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Товары", value: data.totalProducts, icon: Package, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Клиенты", value: data.totalCustomers, icon: UserCheck, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-superadmin-dashboard-title">Панель SuperAdmin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Обзор платформы TakeSale</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5" data-testid={`card-platform-stat-${s.label}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight">{s.value}</p>
            {"sub" in s && s.sub && <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5" data-testid="card-stores-by-plan">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            По тарифам
          </h2>
          <div className="space-y-3">
            {data.storesByPlan.map((item) => (
              <div key={item.plan} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={planColors[item.plan] || ""}>
                    {planLabels[item.plan] || item.plan}
                  </Badge>
                </div>
                <span className="text-sm font-bold">{item.count}</span>
              </div>
            ))}
            {data.storesByPlan.length === 0 && <p className="text-sm text-muted-foreground">Нет данных</p>}
          </div>
        </Card>

        <Card className="p-5" data-testid="card-stores-by-type">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            По типу бизнеса
          </h2>
          <div className="space-y-3">
            {data.storesByType.map((item) => {
              const bt = BUSINESS_TYPES[item.type as keyof typeof BUSINESS_TYPES];
              return (
                <div key={item.type} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{bt?.label || item.type}</span>
                  <span className="text-sm font-bold">{item.count}</span>
                </div>
              );
            })}
            {data.storesByType.length === 0 && <p className="text-sm text-muted-foreground">Нет данных</p>}
          </div>
        </Card>
      </div>

      <Card className="p-5" data-testid="card-recent-stores">
        <h2 className="text-sm font-semibold mb-4">Последние магазины</h2>
        <div className="space-y-2">
          {data.recentStores.map((store) => (
            <div key={store.id} className="flex items-center justify-between gap-3 rounded-md border px-4 py-3" data-testid={`row-recent-store-${store.id}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{store.name}</p>
                <p className="text-xs text-muted-foreground">/s/{store.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={planColors[store.plan] || ""}>
                  {planLabels[store.plan] || store.plan}
                </Badge>
                <Badge variant={store.isActive ? "secondary" : "destructive"}>
                  {store.isActive ? "Активен" : "Отключён"}
                </Badge>
              </div>
            </div>
          ))}
          {data.recentStores.length === 0 && <p className="text-sm text-muted-foreground">Нет магазинов</p>}
        </div>
        <div className="mt-4">
          <Link href="/superadmin/stores" className="text-sm font-medium text-blue-600 hover:underline" data-testid="link-all-stores">
            Все магазины →
          </Link>
        </div>
      </Card>
    </div>
  );
}
