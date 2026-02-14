import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Store, Package, ShoppingCart, Users, ExternalLink, Power, PowerOff, Search, DollarSign, Calendar, Clock, CreditCard, CircleDot, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { BUSINESS_TYPES, PLAN_PRICES, PLAN_NAMES, PLAN_LIMITS } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";

interface StoreWithStats {
  id: number;
  name: string;
  slug: string;
  plan: string;
  planStartedAt: string | null;
  planExpiresAt: string | null;
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

const planColors: Record<string, string> = {
  free: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  pro: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  business: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
};

const planDotColors: Record<string, string> = {
  free: "text-zinc-400",
  pro: "text-blue-500",
  business: "text-purple-500",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function getPlanExpiry(plan: string, expiresAt: string | null) {
  if (plan === "free") return null;
  if (!expiresAt) return { label: "Бессрочный", expired: false };
  const exp = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: `Истёк ${formatDate(expiresAt)}`, expired: true };
  if (daysLeft <= 7) return { label: `${daysLeft} дн. осталось`, expired: false, warning: true };
  return { label: `до ${formatDate(expiresAt)}`, expired: false };
}

function StoreRow({ store, onChangePlan, onToggleActive, isPlanPending, isActivePending }: {
  store: StoreWithStats;
  onChangePlan: (id: number, plan: string) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  isPlanPending: boolean;
  isActivePending: boolean;
}) {
  const bt = store.businessType ? BUSINESS_TYPES[store.businessType as keyof typeof BUSINESS_TYPES] : null;
  const expiry = getPlanExpiry(store.plan, store.planExpiresAt);
  const price = PLAN_PRICES[store.plan] || 0;
  const limit = PLAN_LIMITS[store.plan] || 30;

  return (
    <Card
      key={store.id}
      className={`p-0 overflow-visible transition-all ${
        !store.isActive ? "opacity-60" : ""
      }`}
      data-testid={`card-store-${store.id}`}
    >
      <div className={`h-1 rounded-t-md ${
        store.plan === "business" ? "bg-purple-500" :
        store.plan === "pro" ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"
      }`} />

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Link href={`/superadmin/stores/${store.id}`}>
            <div className="min-w-0 flex-1 cursor-pointer">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold hover:text-blue-600 transition-colors" data-testid={`text-store-name-${store.id}`}>{store.name}</h3>

                {store.isActive ? (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" data-testid={`badge-store-active-${store.id}`}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Активен
                  </Badge>
                ) : (
                  <Badge variant="destructive" data-testid={`badge-store-active-${store.id}`}>
                    <XCircle className="h-3 w-3 mr-1" />
                    Отключён
                  </Badge>
                )}

                <Badge variant="secondary" className={planColors[store.plan] || ""} data-testid={`badge-store-plan-${store.id}`}>
                  <CircleDot className={`h-3 w-3 mr-1 ${planDotColors[store.plan] || ""}`} />
                  {store.plan.toUpperCase()} {price > 0 ? `· ${price.toLocaleString("ru-RU")} ₸/мес` : ""}
                </Badge>

                {expiry?.expired && (
                  <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Просрочен
                  </Badge>
                )}
                {expiry?.warning && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {expiry.label}
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">/s/{store.slug} {store.city ? `· ${store.city}` : ""}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span>{bt?.label || "Не указан"}</span>
                <span>Владелец: {store.ownerEmail || "—"}</span>
                {store.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(store.createdAt)}
                  </span>
                )}
                {expiry && !expiry.expired && !expiry.warning && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {expiry.label}
                  </span>
                )}
              </div>
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
              onClick={() => onToggleActive(store.id, !store.isActive)}
              disabled={isActivePending}
              data-testid={`button-toggle-active-${store.id}`}
            >
              {store.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </Button>
            <Select
              value={store.plan}
              onValueChange={(plan) => onChangePlan(store.id, plan)}
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

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Товары</p>
              <p className="text-sm font-bold" data-testid={`text-store-products-${store.id}`}>{store.productsCount}/{limit}</p>
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
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Тариф/мес</p>
              <p className="text-sm font-bold">{price > 0 ? `${price.toLocaleString("ru-RU")} ₸` : "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

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
  const totalMonthlyRevenue = stores?.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0) || 0;
  const activeCount = stores?.filter(s => s.isActive).length || 0;
  const inactiveCount = stores?.filter(s => !s.isActive).length || 0;

  const filtered = stores?.filter((s) => {
    let passFilter = true;
    if (filter === "active") passFilter = s.isActive;
    else if (filter === "inactive") passFilter = !s.isActive;
    else if (filter === "expired") {
      const exp = getPlanExpiry(s.plan, s.planExpiresAt);
      passFilter = exp?.expired === true;
    } else if (filter !== "all") passFilter = s.plan === filter;

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

  const planSummary = {
    free: stores?.filter(s => s.plan === "free").length || 0,
    pro: stores?.filter(s => s.plan === "pro").length || 0,
    business: stores?.filter(s => s.plan === "business").length || 0,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-superadmin-stores-title">Магазины</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Всего: {stores?.length || 0} · <span className="text-emerald-600 dark:text-emerald-400">{activeCount} активных</span> · <span className="text-red-500">{inactiveCount} отключённых</span> · Выручка: {totalRevenue.toLocaleString("ru-RU")} ₸
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
              <SelectItem value="expired">Просроченные</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
              <span className="text-xs font-medium text-muted-foreground">Free</span>
            </div>
            <Badge variant="secondary" className={planColors.free}>{planSummary.free}</Badge>
          </div>
          <p className="mt-1.5 text-lg font-bold">{(planSummary.free * PLAN_PRICES.free).toLocaleString("ru-RU")} ₸<span className="text-xs font-normal text-muted-foreground">/мес</span></p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Pro</span>
            </div>
            <Badge variant="secondary" className={planColors.pro}>{planSummary.pro}</Badge>
          </div>
          <p className="mt-1.5 text-lg font-bold">{(planSummary.pro * PLAN_PRICES.pro).toLocaleString("ru-RU")} ₸<span className="text-xs font-normal text-muted-foreground">/мес</span></p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-xs font-medium text-muted-foreground">Business</span>
            </div>
            <Badge variant="secondary" className={planColors.business}>{planSummary.business}</Badge>
          </div>
          <p className="mt-1.5 text-lg font-bold">{(planSummary.business * PLAN_PRICES.business).toLocaleString("ru-RU")} ₸<span className="text-xs font-normal text-muted-foreground">/мес</span></p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">MRR итого</span>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1.5 text-lg font-bold">{totalMonthlyRevenue.toLocaleString("ru-RU")} ₸<span className="text-xs font-normal text-muted-foreground">/мес</span></p>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.map((store) => (
          <StoreRow
            key={store.id}
            store={store}
            onChangePlan={(id, plan) => changePlanMutation.mutate({ id, plan })}
            onToggleActive={(id, isActive) => toggleActiveMutation.mutate({ id, isActive })}
            isPlanPending={changePlanMutation.isPending}
            isActivePending={toggleActiveMutation.isPending}
          />
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Магазины не найдены</p>
          </Card>
        )}
      </div>
    </div>
  );
}
