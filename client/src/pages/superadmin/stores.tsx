import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Store, Package, ShoppingCart, Users, ExternalLink, Power, PowerOff, Search, DollarSign } from "lucide-react";
import { BUSINESS_TYPES } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";

interface StoreWithStats {
  id: number;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  businessType: string | null;
  whatsappPhone: string;
  city: string | null;
  createdAt: string | null;
  ownerEmail: string | null;
  productsCount: number;
  ordersCount: number;
  revenue: number;
  customersCount: number;
}

const planLabels: Record<string, string> = { free: "Free", pro: "Pro", business: "Business" };
const planColors: Record<string, string> = {
  free: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  business: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

export default function SuperAdminStores() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { data: stores, isLoading } = useQuery<StoreWithStats[]>({ queryKey: ["/api/superadmin/stores"] });

  const changePlanMutation = useMutation({
    mutationFn: async ({ id, plan }: { id: number; plan: string }) => {
      await apiRequest("PATCH", `/api/superadmin/stores/${id}/plan`, { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/analytics"] });
      toast({ title: "Тариф обновлён" });
    },
    onError: () => toast({ title: "Ошибка обновления", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/superadmin/stores/${id}/active`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/analytics"] });
      toast({ title: "Статус магазина обновлён" });
    },
    onError: () => toast({ title: "Ошибка обновления", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const totalRevenue = stores?.reduce((sum, s) => sum + s.revenue, 0) || 0;

  const filtered = stores?.filter((s) => {
    let passFilter = true;
    if (filter === "active") passFilter = s.isActive;
    else if (filter === "inactive") passFilter = !s.isActive;
    else if (filter !== "all") passFilter = s.plan === filter;

    if (!passFilter) return false;
    if (!search) return true;

    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      (s.ownerEmail && s.ownerEmail.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-superadmin-stores-title">Магазины</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Всего: {stores?.length || 0} · Общая выручка: {totalRevenue.toLocaleString("ru-RU")} ₸
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
              data-testid="input-store-search"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36" data-testid="select-store-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="inactive">Отключённые</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((store) => {
          const bt = store.businessType ? BUSINESS_TYPES[store.businessType as keyof typeof BUSINESS_TYPES] : null;
          return (
            <Card key={store.id} className="p-5" data-testid={`card-store-${store.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <Link href={`/superadmin/stores/${store.id}`}>
                  <div className="min-w-0 flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold hover:text-blue-600 transition-colors" data-testid={`text-store-name-${store.id}`}>{store.name}</h3>
                      <Badge variant={store.isActive ? "secondary" : "destructive"} data-testid={`badge-store-active-${store.id}`}>
                        {store.isActive ? "Активен" : "Отключён"}
                      </Badge>
                      <Badge variant="secondary" className={planColors[store.plan] || ""} data-testid={`badge-store-plan-${store.id}`}>
                        {planLabels[store.plan] || store.plan}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">/s/{store.slug} {store.city ? `· ${store.city}` : ""}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bt?.label || "Не указан"} · Владелец: {store.ownerEmail || "—"}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 flex-wrap">
                  <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" data-testid={`button-view-store-${store.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    variant={store.isActive ? "outline" : "default"}
                    size="icon"
                    onClick={() => toggleActiveMutation.mutate({ id: store.id, isActive: !store.isActive })}
                    disabled={toggleActiveMutation.isPending}
                    data-testid={`button-toggle-active-${store.id}`}
                  >
                    {store.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  </Button>
                  <Select
                    value={store.plan}
                    onValueChange={(plan) => changePlanMutation.mutate({ id: store.id, plan })}
                  >
                    <SelectTrigger className="w-28" data-testid={`select-plan-${store.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Товары</p>
                    <p className="text-sm font-bold" data-testid={`text-store-products-${store.id}`}>{store.productsCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Заказы</p>
                    <p className="text-sm font-bold" data-testid={`text-store-orders-${store.id}`}>{store.ordersCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Выручка</p>
                    <p className="text-sm font-bold" data-testid={`text-store-revenue-${store.id}`}>{store.revenue.toLocaleString("ru-RU")} ₸</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Клиенты</p>
                    <p className="text-sm font-bold" data-testid={`text-store-customers-${store.id}`}>{store.customersCount}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Магазины не найдены</p>
          </Card>
        )}
      </div>
    </div>
  );
}
