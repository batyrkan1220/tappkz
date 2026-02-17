import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Eye, MousePointerClick, ShoppingCart, Package, FolderOpen, ExternalLink, Copy, ArrowRight, Check, BookOpen, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useBusinessLabels } from "@/hooks/use-business-labels";
import { UpgradeBanner } from "@/components/upgrade-banner";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Store, Product, Category } from "@shared/schema";

interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  buttonText: string;
  disabled?: boolean;
}

export default function Dashboard() {
  useDocumentTitle("Панель управления");
  const { toast } = useToast();
  const labels = useBusinessLabels();
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

  const storeUrl = `${window.location.origin}/${store.slug}`;
  const hasCategories = (categories?.length ?? 0) > 0;
  const hasProducts = (products?.length ?? 0) > 0;
  const hasDelivery = store.deliveryEnabled || store.pickupEnabled;
  const hasDesign = !!(store.logoUrl || store.bannerUrl || store.secondaryColor);

  const steps: OnboardingStep[] = [
    {
      key: "categories",
      title: `Шаг 1: Создайте ${labels.categoryLabel.toLowerCase()}`,
      description: "Добавьте категории для организации товаров",
      completed: hasCategories,
      href: "/admin/categories",
      buttonText: "Создать",
    },
    {
      key: "products",
      title: `Шаг 2: Добавьте ${labels.itemLabel}`,
      description: "Добавьте товары с ценами и фото",
      completed: hasProducts,
      href: "/admin/products",
      buttonText: "Добавить",
      disabled: !hasCategories,
    },
    {
      key: "delivery",
      title: "Шаг 3: Настройте доставку",
      description: "Укажите способы получения: самовывоз или курьер",
      completed: hasDelivery,
      href: "/admin/delivery",
      buttonText: "Настроить",
      disabled: !hasProducts,
    },
    {
      key: "design",
      title: "Шаг 4: Оформите магазин",
      description: "Загрузите логотип, баннер и выберите цвета",
      completed: hasDesign,
      href: "/admin/branding",
      buttonText: "Оформить",
      disabled: !hasProducts,
    },
    {
      key: "share",
      title: "Шаг 5: Поделитесь ссылкой",
      description: `Отправьте ссылку клиентам: ${storeUrl}`,
      completed: (analytics?.visits ?? 0) > 0,
      href: `/${store.slug}`,
      buttonText: "Открыть",
      disabled: !hasProducts,
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const isOnboarded = completedSteps >= 3 && hasCategories && hasProducts;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "Ссылка скопирована!" });
  };

  const stats = [
    { label: "Просмотры", value: analytics?.visits ?? 0, icon: Eye, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "В корзину", value: analytics?.addToCarts ?? 0, icon: ShoppingCart, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Заказы WhatsApp", value: analytics?.checkouts ?? 0, icon: MousePointerClick, color: "text-primary", bg: "bg-primary/10 dark:bg-primary/5" },
  ];

  const productLimit = store.plan === "free" ? 30 : store.plan === "business" ? 500 : 5000;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-dashboard-title">Панель управления</h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-dashboard-store">Магазин: {store.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/guide" data-testid="link-guide">
            <Button variant="outline" className="rounded-full font-semibold" data-testid="button-guide">
              <BookOpen className="mr-1.5 h-4 w-4" />
              Гайд по старту
            </Button>
          </Link>
          <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" data-testid="link-view-store">
            <Button variant="outline" className="rounded-full font-semibold" data-testid="button-view-store">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Открыть магазин
            </Button>
          </a>
        </div>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4" data-testid="card-store-url">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/5">
          <Copy className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Ссылка на магазин</p>
          <code className="block truncate text-sm font-semibold" data-testid="text-store-url">{storeUrl}</code>
        </div>
        <Button variant="outline" className="rounded-full font-semibold" onClick={copyUrl} data-testid="button-copy-url">
          <Copy className="mr-1.5 h-4 w-4" />
          Копировать
        </Button>
      </Card>

      {!isOnboarded && (
        <Card className="p-5 border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/5" data-testid="card-onboarding">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-extrabold tracking-tight" data-testid="text-onboarding-title">Запуск за 5 минут</h2>
                <p className="text-xs text-muted-foreground">Выполните шаги, чтобы запустить магазин</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs font-bold no-default-hover-elevate no-default-active-elevate" data-testid="badge-onboarding-progress">
              {completedSteps}/{steps.length}
            </Badge>
          </div>

          <div className="mb-4">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
                data-testid="progress-onboarding"
              />
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const stepIcon = step.completed ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
              );

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-md border px-4 py-3 ${
                    step.completed
                      ? "bg-background border-primary/30 dark:border-primary/40"
                      : step.disabled
                        ? "bg-muted/30 border-border opacity-60"
                        : "bg-background border-border"
                  }`}
                  data-testid={`onboarding-step-${idx + 1}`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step.completed ? "bg-primary" : "bg-muted"}`}>
                    {stepIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {!step.completed && !step.disabled && (
                    step.key === "share" ? (
                      <div className="flex gap-2">
                        <Button variant="outline" className="rounded-full font-semibold" onClick={copyUrl} data-testid="button-onboarding-copy">
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Копировать
                        </Button>
                      </div>
                    ) : (
                      <Link href={step.href} data-testid={`link-onboarding-${step.key}`}>
                        <Button className="rounded-full font-semibold" data-testid={`button-onboarding-${step.key}`}>
                          {step.buttonText}
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <UpgradeBanner />

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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/5">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{labels.itemLabelPlural}</span>
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
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(((products?.length ?? 0) / productLimit) * 100, 100)}%` }} />
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
    </div>
  );
}
