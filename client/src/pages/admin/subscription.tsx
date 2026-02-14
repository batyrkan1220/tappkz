import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Crown, CheckCircle2, Package, Calendar, Clock, Zap } from "lucide-react";
import type { Store } from "@shared/schema";

type TariffData = Record<string, { price: number; limit: number; name: string; features: string[] }>;

const PLAN_KEYS = ["free", "pro", "business"] as const;
const PLAN_DISPLAY: Record<string, { label: string; color: string; badgeClass: string }> = {
  free: { label: "Старт", color: "text-zinc-600", badgeClass: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  pro: { label: "Бизнес", color: "text-blue-600", badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  business: { label: "Про", color: "text-purple-600", badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

const PLAN_STRIPE_COLORS: Record<string, string> = {
  free: "bg-zinc-400",
  pro: "bg-blue-500",
  business: "bg-purple-500",
};

export default function SubscriptionPage() {
  const { data: store, isLoading: storeLoading } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: tariffs, isLoading: tariffsLoading } = useQuery<TariffData>({ queryKey: ["/api/tariffs"] });
  const { data: products } = useQuery<any[]>({ queryKey: ["/api/my-store/products"] });

  if (storeLoading || tariffsLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const currentPlan = store?.plan || "free";
  const productCount = products?.length || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
          <Crown className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-subscription-title">Подписка</h1>
          <p className="text-xs text-muted-foreground">Управление тарифным планом</p>
        </div>
      </div>

      <Card className="p-5" data-testid="card-current-plan">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Текущий тариф</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight" data-testid="text-current-plan-name">
                {PLAN_DISPLAY[currentPlan]?.label || currentPlan}
              </h2>
              <Badge className={`rounded-full font-semibold no-default-hover-elevate no-default-active-elevate ${PLAN_DISPLAY[currentPlan]?.badgeClass || ""}`}>
                {tariffs?.[currentPlan]?.name || currentPlan.toUpperCase()}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-current-plan-price">
              {(tariffs?.[currentPlan]?.price || 0) > 0
                ? `${(tariffs?.[currentPlan]?.price || 0).toLocaleString("ru-RU")} ₸/мес`
                : "Бесплатно"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold" data-testid="text-usage-count">
              {productCount} / {tariffs?.[currentPlan]?.limit || 30} товаров
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mt-4">
          <div className="rounded-md border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <Package className="h-3 w-3" />
              Лимит товаров
            </div>
            <p className="text-sm font-bold" data-testid="text-plan-limit">{tariffs?.[currentPlan]?.limit || 30} шт.</p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <Calendar className="h-3 w-3" />
              Начало тарифа
            </div>
            <p className="text-sm font-bold">
              {store?.planStartedAt
                ? new Date(store.planStartedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
                : currentPlan === "free" ? "—" : "—"}
            </p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <Clock className="h-3 w-3" />
              Действует до
            </div>
            <p className={`text-sm font-bold ${store?.planExpiresAt && new Date(store.planExpiresAt) < new Date() ? "text-red-600" : ""}`}>
              {currentPlan === "free"
                ? "Бессрочно"
                : store?.planExpiresAt
                  ? new Date(store.planExpiresAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-extrabold tracking-tight mb-4" data-testid="text-all-plans-heading">Все тарифы</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_KEYS.map((planKey) => {
            const plan = tariffs?.[planKey];
            const display = PLAN_DISPLAY[planKey];
            const isCurrent = planKey === currentPlan;
            const price = plan?.price || 0;
            const limit = plan?.limit || 30;
            const features = plan?.features || [];

            return (
              <Card
                key={planKey}
                className={`relative overflow-visible ${isCurrent ? "border-primary border-2 shadow-lg shadow-primary/10" : ""}`}
                data-testid={`card-plan-${planKey}`}
              >
                <div className={`h-1.5 rounded-t-md ${PLAN_STRIPE_COLORS[planKey]}`} />
                <div className="p-5">
                  {isCurrent && (
                    <Badge className="absolute -top-2.5 right-4 rounded-full font-semibold no-default-hover-elevate no-default-active-elevate shadow-md" data-testid="badge-current-plan">
                      Текущий
                    </Badge>
                  )}
                  <h4 className={`text-sm font-semibold uppercase tracking-wider ${display?.color || "text-muted-foreground"}`}>
                    {display?.label || planKey}
                  </h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {price === 0 ? "0 ₸" : `${price.toLocaleString("ru-RU")} ₸`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {price === 0 ? "навсегда" : "/мес"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">до {limit} товаров</p>

                  <ul className="mt-4 space-y-2">
                    {features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full rounded-full font-semibold" disabled data-testid={`button-plan-current-${planKey}`}>
                        Текущий план
                      </Button>
                    ) : (
                      <Button
                        variant={planKey === "pro" ? "default" : "outline"}
                        className="w-full rounded-full font-semibold"
                        disabled
                        data-testid={`button-plan-select-${planKey}`}
                      >
                        {price === 0 ? "Понизить" : "Улучшить"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground" data-testid="text-plan-contact">
          Для смены тарифа свяжитесь с поддержкой через WhatsApp
        </p>
      </div>
    </div>
  );
}
