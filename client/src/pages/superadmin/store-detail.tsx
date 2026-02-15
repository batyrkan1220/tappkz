import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Store, Package, ShoppingCart, Users, ExternalLink, Power, PowerOff, ArrowLeft, Settings, Palette, Globe, Phone, MapPin, Mail, TrendingUp, CreditCard, Calendar, Clock } from "lucide-react";
import { BUSINESS_TYPES, PLAN_PRICES, PLAN_NAMES, PLAN_LIMITS, PLAN_ORDER_LIMITS, PLAN_IMAGE_LIMITS } from "@shared/schema";
import { Link, useParams } from "wouter";

interface StoreDetail {
  store: {
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
    description: string | null;
    ownerUserId: string;
    createdAt: string | null;
  };
  ownerEmail: string | null;
  settings: {
    showPrices: boolean;
    currency: string;
    instagramUrl: string | null;
    phoneNumber: string | null;
  } | null;
  theme: {
    primaryColor: string;
    secondaryColor: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    buttonStyle: string;
    cardStyle: string;
    fontStyle: string;
  } | null;
  productsCount: number;
  ordersCount: number;
  revenue: number;
  customersCount: number;
  recentOrders: {
    id: number;
    orderNumber: number;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string | null;
  }[];
  recentCustomers: {
    id: number;
    name: string;
    phone: string | null;
    totalOrders: number;
    totalSpent: number;
    createdAt: string | null;
  }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

const planColors: Record<string, string> = {
  free: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  business: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  completed: "Выполнен",
  cancelled: "Отменён",
};
const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Almaty" });
}

function formatDateTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" });
}

type TabKey = "overview" | "orders" | "customers" | "products";

export default function SuperAdminStoreDetail() {
  const params = useParams<{ id: string }>();
  const storeId = parseInt(params.id || "0");
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("overview");

  const { data, isLoading } = useQuery<StoreDetail>({
    queryKey: ["/api/superadmin/stores", storeId],
    queryFn: async () => {
      const res = await fetch(`/api/superadmin/stores/${storeId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: storeId > 0,
  });

  type TariffData = Record<string, { price: number; limit: number; orderLimit: number; imageLimit: number; name: string; features: string[] }>;
  const { data: tariffs } = useQuery<TariffData>({ queryKey: ["/api/tariffs"] });

  const changePlanMutation = useMutation({
    mutationFn: async (plan: string) => {
      await apiRequest("PATCH", `/api/superadmin/stores/${storeId}/plan`, { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stores", storeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/analytics"] });
      toast({ title: "Тариф обновлён" });
    },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      await apiRequest("PATCH", `/api/superadmin/stores/${storeId}/active`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stores", storeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/stores"] });
      toast({ title: "Статус обновлён" });
    },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Магазин не найден</p>
          <Link href="/superadmin/stores">
            <Button variant="outline" className="mt-4">Назад</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { store, settings, theme } = data;
  const bt = store.businessType ? BUSINESS_TYPES[store.businessType as keyof typeof BUSINESS_TYPES] : null;
  const tariffData = tariffs?.[store.plan];
  const planPrice = tariffData?.price ?? PLAN_PRICES[store.plan] ?? 0;
  const planLimit = tariffData?.limit ?? PLAN_LIMITS[store.plan] ?? 30;
  const planName = tariffData?.name ?? PLAN_NAMES[store.plan] ?? store.plan;
  const planOrderLimit = tariffData?.orderLimit ?? PLAN_ORDER_LIMITS[store.plan] ?? 50;
  const planImageLimit = tariffData?.imageLimit ?? PLAN_IMAGE_LIMITS[store.plan] ?? 20;

  const isExpired = store.plan !== "free" && store.planExpiresAt && new Date(store.planExpiresAt) < new Date();
  const daysLeft = store.planExpiresAt ? Math.ceil((new Date(store.planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const statCards = [
    { label: "Товары", value: `${data.productsCount}/${planLimit}`, icon: Package, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Заказы", value: data.ordersCount, icon: ShoppingCart, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Выручка", value: `${data.revenue.toLocaleString("ru-RU")} ₸`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Клиенты", value: data.customersCount, icon: Users, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Обзор" },
    { key: "orders", label: `Заказы (${data.ordersCount})` },
    { key: "customers", label: `Клиенты (${data.customersCount})` },
    { key: "products", label: `Товары (${data.productsCount})` },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/stores">
          <Button variant="ghost" size="icon" data-testid="button-back-stores">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight truncate" data-testid="text-store-detail-name">{store.name}</h1>
            <Badge variant={store.isActive ? "secondary" : "destructive"}>
              {store.isActive ? "Активен" : "Отключён"}
            </Badge>
            <Badge variant="secondary" className={planColors[store.plan] || ""}>
              {store.plan.toUpperCase()}
            </Badge>
            {isExpired && <Badge variant="destructive">Просрочен</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            /{store.slug} · {bt?.label || "Не указан"} · Владелец: {data.ownerEmail || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon" data-testid="button-view-storefront">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <Button
            variant={store.isActive ? "outline" : "default"}
            size="icon"
            onClick={() => toggleActiveMutation.mutate(!store.isActive)}
            disabled={toggleActiveMutation.isPending}
            data-testid="button-toggle-store-active"
          >
            {store.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          </Button>
          <Select value={store.plan} onValueChange={(plan) => changePlanMutation.mutate(plan)}>
            <SelectTrigger className="w-28" data-testid="select-store-plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5" data-testid="card-plan-detail">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Тариф и подписка
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Текущий тариф</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={planColors[store.plan] || ""}>{store.plan.toUpperCase()}</Badge>
              <span className="text-sm font-medium">{planName}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Стоимость</p>
            <p className="text-sm font-bold">
              {planPrice > 0 ? `${planPrice.toLocaleString("ru-RU")} ₸/мес` : "Бесплатно"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Начало тарифа</p>
            <p className="text-sm flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {formatDate(store.planStartedAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Действует до</p>
            <p className={`text-sm flex items-center gap-1 ${isExpired ? "text-red-600 font-bold" : daysLeft !== null && daysLeft <= 7 ? "text-amber-600 font-bold" : ""}`}>
              <Clock className="h-3.5 w-3.5" />
              {store.plan === "free" ? "Бессрочно" : formatDate(store.planExpiresAt)}
              {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && store.plan !== "free" && (
                <span className="text-xs text-muted-foreground ml-1">({daysLeft} дн.)</span>
              )}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span>Товары: {data.productsCount}/{planLimit}</span>
          <span>Заказы/мес: {planOrderLimit < 0 ? "Безлимит" : planOrderLimit}</span>
          <span>Изображения: {planImageLimit < 0 ? "Безлимит" : planImageLimit}</span>
          {store.createdAt && <span>Создан: {formatDate(store.createdAt)}</span>}
        </div>
      </Card>

      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors shrink-0 ${tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab(t.key)}
            data-testid={`tab-store-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Информация
            </h3>
            <div className="space-y-2 text-sm">
              {store.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{store.city}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>WhatsApp: {store.whatsappPhone}</span>
              </div>
              {settings?.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{settings.phoneNumber}</span>
                </div>
              )}
              {settings?.instagramUrl && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{settings.instagramUrl}</span>
                </div>
              )}
              {data.ownerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{data.ownerEmail}</span>
                </div>
              )}
              {store.description && (
                <p className="text-muted-foreground mt-2">{store.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary">Цены: {settings?.showPrices ? "Показаны" : "Скрыты"}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              Дизайн
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Основной цвет:</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-md border" style={{ backgroundColor: theme?.primaryColor || "#2563eb" }} />
                  <span>{theme?.primaryColor || "#2563eb"}</span>
                </div>
              </div>
              {theme?.secondaryColor && (
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Вторичный:</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-md border" style={{ backgroundColor: theme.secondaryColor }} />
                    <span>{theme.secondaryColor}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary">Кнопки: {theme?.buttonStyle || "pill"}</Badge>
                <Badge variant="secondary">Карточки: {theme?.cardStyle || "bordered"}</Badge>
                <Badge variant="secondary">Шрифт: {theme?.fontStyle || "modern"}</Badge>
              </div>
              {theme?.logoUrl && (
                <div>
                  <span className="text-muted-foreground">Логотип:</span>
                  <img src={theme.logoUrl} alt="Logo" className="mt-1 h-12 rounded-md object-contain" />
                </div>
              )}
            </div>
          </Card>

          {data.topProducts.length > 0 && (
            <Card className="p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Топ товары
              </h3>
              <div className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-md border px-4 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-sm">
                      <span className="text-muted-foreground">{p.quantity} шт</span>
                      <span className="font-bold">{p.revenue.toLocaleString("ru-RU")} ₸</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {data.recentOrders.length > 0 ? data.recentOrders.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold">#{o.orderNumber}</span>
                    <Badge variant="secondary" className={statusColors[o.status] || ""}>
                      {statusLabels[o.status] || o.status}
                    </Badge>
                  </div>
                  <p className="text-sm mt-0.5">{o.customerName} · {o.customerPhone}</p>
                  {o.createdAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(o.createdAt).toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}
                    </p>
                  )}
                </div>
                <span className="text-lg font-bold">{o.total.toLocaleString("ru-RU")} ₸</span>
              </div>
            </Card>
          )) : (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Нет заказов</p>
            </Card>
          )}
        </div>
      )}

      {tab === "customers" && (
        <div className="space-y-3">
          {data.recentCustomers.length > 0 ? data.recentCustomers.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold">{c.totalSpent.toLocaleString("ru-RU")} ₸</p>
                  <p className="text-xs text-muted-foreground">{c.totalOrders} заказов</p>
                </div>
              </div>
            </Card>
          )) : (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Нет клиентов</p>
            </Card>
          )}
        </div>
      )}

      {tab === "products" && (
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            Всего товаров: {data.productsCount}/{planLimit} (лимит тарифа {store.plan.toUpperCase()}).
            <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
              Посмотреть магазин
            </a>
          </p>
          {data.topProducts.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Самые продаваемые:</h4>
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="font-bold shrink-0">{p.quantity} шт · {p.revenue.toLocaleString("ru-RU")} ₸</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
