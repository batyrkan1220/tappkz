import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Zap, TrendingUp, ShoppingCart, Package, ImageIcon, ArrowRight, AlertTriangle } from "lucide-react";

interface UsageData {
  plan: string;
  products: number;
  productLimit: number;
  monthlyOrders: number;
  orderLimit: number;
  totalImages: number;
  imageLimit: number;
}

function UsageBar({ used, limit, label, icon: Icon }: { used: number; limit: number; label: string; icon: typeof Package }) {
  const isUnlimited = limit < 0;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNear = !isUnlimited && pct >= 70;
  const isAtLimit = !isUnlimited && pct >= 100;

  return (
    <div className="space-y-1" data-testid={`usage-bar-${label}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <span className={`text-xs font-bold ${isAtLimit ? "text-red-600" : isNear ? "text-amber-600" : ""}`}>
          {used} / {isUnlimited ? "\u221e" : limit}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isAtLimit ? "bg-red-500" : isNear ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${isUnlimited ? 0 : pct}%` }}
        />
      </div>
    </div>
  );
}

export function UpgradeBanner() {
  const { data: usage } = useQuery<UsageData>({ queryKey: ["/api/my-store/usage"] });

  if (!usage || usage.plan !== "free") return null;

  const productPct = usage.productLimit > 0 ? (usage.products / usage.productLimit) * 100 : 0;
  const orderPct = usage.orderLimit > 0 ? (usage.monthlyOrders / usage.orderLimit) * 100 : 0;
  const imagePct = usage.imageLimit > 0 ? (usage.totalImages / usage.imageLimit) * 100 : 0;

  const anyNear = productPct >= 70 || orderPct >= 70 || imagePct >= 70;
  const anyAtLimit = productPct >= 100 || orderPct >= 100 || imagePct >= 100;

  if (!anyNear && productPct < 50 && orderPct < 50 && imagePct < 50) {
    return (
      <Card className="p-4 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20" data-testid="card-upgrade-promo">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" data-testid="text-upgrade-promo-title">Развивайте бизнес с TakeSale</p>
            <p className="text-xs text-muted-foreground">Безлимитные заказы, изображения, свой домен и аналитика</p>
          </div>
          <Link href="/admin/subscription" data-testid="link-upgrade-promo">
            <Button variant="outline" className="rounded-full font-semibold text-xs" data-testid="button-upgrade-promo">
              <Zap className="mr-1 h-3.5 w-3.5" />
              Бизнес тариф
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${anyAtLimit ? "border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50/80 to-amber-50/80 dark:from-red-950/20 dark:to-amber-950/20" : "border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20"}`} data-testid="card-upgrade-limit-warning">
      <div className="flex flex-wrap items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${anyAtLimit ? "bg-red-100 dark:bg-red-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
          {anyAtLimit
            ? <AlertTriangle className="h-4 w-4 text-red-600" />
            : <Zap className="h-4 w-4 text-amber-600" />
          }
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold" data-testid="text-limit-warning-title">
                {anyAtLimit ? "Лимит достигнут!" : "Приближение к лимитам"}
              </p>
              <Badge variant="secondary" className="rounded-full text-[10px] font-bold no-default-hover-elevate no-default-active-elevate">
                Базовый план
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {anyAtLimit
                ? "Перейдите на Бизнес тариф для безлимитных возможностей"
                : "Скоро вы достигнете лимитов Базового тарифа"}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <UsageBar used={usage.products} limit={usage.productLimit} label="Товары" icon={Package} />
            <UsageBar used={usage.monthlyOrders} limit={usage.orderLimit} label="Заказы/мес" icon={ShoppingCart} />
            <UsageBar used={usage.totalImages} limit={usage.imageLimit} label="Изображения" icon={ImageIcon} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/subscription" data-testid="link-upgrade-limit">
              <Button className="rounded-full font-semibold text-xs" data-testid="button-upgrade-limit">
                <Zap className="mr-1 h-3.5 w-3.5" />
                Перейти на Бизнес — 17 500 ₸/мес
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
            <span className="text-[11px] text-muted-foreground">Безлимитные заказы, изображения и товары</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LimitAlert({ type, current, limit }: { type: "products" | "orders" | "images"; current: number; limit: number }) {
  if (limit < 0) return null;
  const pct = (current / limit) * 100;
  if (pct < 80) return null;
  const isAtLimit = pct >= 100;

  const labels: Record<string, { name: string; action: string }> = {
    products: { name: "товаров", action: "добавлять товары" },
    orders: { name: "заказов в этом месяце", action: "принимать заказы" },
    images: { name: "изображений", action: "загружать изображения" },
  };

  const l = labels[type];

  return (
    <Card className={`flex items-center gap-3 p-3 ${isAtLimit ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10" : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10"}`} data-testid={`card-limit-alert-${type}`}>
      <AlertTriangle className={`h-4 w-4 shrink-0 ${isAtLimit ? "text-red-600" : "text-amber-600"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" data-testid={`text-limit-alert-${type}`}>
          {isAtLimit
            ? `Лимит достигнут: ${current}/${limit} ${l.name}`
            : `${current}/${limit} ${l.name} использовано`}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {isAtLimit
            ? `Перейдите на Бизнес тариф, чтобы продолжить ${l.action}`
            : `Приближаетесь к лимиту — перейдите на Бизнес тариф`}
        </p>
      </div>
      <Link href="/admin/subscription" data-testid={`link-limit-alert-${type}`}>
        <Button variant="outline" size="sm" className="rounded-full font-semibold text-xs shrink-0" data-testid={`button-limit-alert-${type}`}>
          <Zap className="mr-1 h-3 w-3" />
          Улучшить
        </Button>
      </Link>
    </Card>
  );
}

export function useUsageData() {
  return useQuery<UsageData>({ queryKey: ["/api/my-store/usage"] });
}
