import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  FolderOpen,
  Package,
  Truck,
  Palette,
  Share2,
  Percent,
  ClipboardList,
  MessageCircle,
  Sparkles,
  Clock,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Store, Product, Category } from "@shared/schema";

interface GuideStep {
  key: string;
  icon: typeof FolderOpen;
  title: string;
  description: string;
  tips: string[];
  href: string;
  buttonText: string;
  time: string;
  completed: boolean;
  color: string;
  bg: string;
}

export default function GuidePage() {
  useDocumentTitle("Гайд по старту");
  const { toast } = useToast();
  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: products } = useQuery<Product[]>({ queryKey: ["/api/my-store/products"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/my-store/categories"] });
  const { data: analytics } = useQuery<{ visits: number; checkouts: number; addToCarts: number }>({
    queryKey: ["/api/my-store/analytics"],
  });

  if (!store) return null;

  const storeUrl = `${window.location.origin}/${store.slug}`;
  const hasCategories = (categories?.length ?? 0) > 0;
  const hasProducts = (products?.length ?? 0) > 0;
  const hasDelivery = store.deliveryEnabled || store.pickupEnabled;
  const hasDesign = !!(store.logoUrl || store.bannerUrl || store.secondaryColor);
  const hasVisits = (analytics?.visits ?? 0) > 0;

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "Ссылка скопирована!" });
  };

  const steps: GuideStep[] = [
    {
      key: "categories",
      icon: FolderOpen,
      title: "1. Создайте категории",
      description: "Категории помогают покупателям быстро найти нужный товар. Создайте 2-5 категорий для начала.",
      tips: [
        "Назовите категории понятно для покупателей: \"Пицца\", \"Десерты\", \"Напитки\"",
        "Можно указать порядок отображения категорий",
        "Категории с фото привлекают больше внимания",
      ],
      href: "/admin/categories",
      buttonText: "Создать категории",
      time: "1 мин",
      completed: hasCategories,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      key: "products",
      icon: Package,
      title: "2. Добавьте товары",
      description: "Добавьте свои товары или услуги с фотографиями и ценами. Начните с 3-5 самых популярных.",
      tips: [
        "Качественные фото увеличивают конверсию на 40%",
        "Указывайте точные цены — клиенты это ценят",
        "Добавляйте описание с ключевыми преимуществами товара",
        "Используйте варианты для размеров, цветов и т.д.",
      ],
      href: "/admin/products",
      buttonText: "Добавить товары",
      time: "2-3 мин",
      completed: hasProducts,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      key: "delivery",
      icon: Truck,
      title: "3. Настройте доставку",
      description: "Укажите, как клиенты получат заказ: самовывоз, курьерская доставка или оба варианта.",
      tips: [
        "Самовывоз — самый простой вариант для старта",
        "Для доставки укажите стоимость и зону обслуживания",
        "Можно указать сумму для бесплатной доставки — это увеличивает средний чек",
      ],
      href: "/admin/delivery",
      buttonText: "Настроить доставку",
      time: "1 мин",
      completed: hasDelivery,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      key: "design",
      icon: Palette,
      title: "4. Оформите витрину",
      description: "Загрузите логотип, баннер и выберите фирменные цвета, чтобы магазин выглядел профессионально.",
      tips: [
        "Логотип должен быть узнаваемым и чётким",
        "Баннер — первое, что видит клиент. Используйте красивое фото",
        "Выберите цвета, которые соответствуют вашему бренду",
      ],
      href: "/admin/branding",
      buttonText: "Оформить витрину",
      time: "1 мин",
      completed: hasDesign,
      color: "text-pink-600",
      bg: "bg-pink-50 dark:bg-pink-950/30",
    },
    {
      key: "share",
      icon: Share2,
      title: "5. Поделитесь ссылкой",
      description: "Отправьте ссылку на ваш магазин клиентам в WhatsApp, Instagram или другие каналы.",
      tips: [
        "Разместите ссылку в описании Instagram профиля",
        "Отправьте ссылку в WhatsApp-группы и чаты",
        "Добавьте ссылку на визитку или упаковку",
        "Поделитесь с друзьями и попросите отзыв",
      ],
      href: `/${store.slug}`,
      buttonText: "Открыть магазин",
      time: "30 сек",
      completed: hasVisits,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  const bonusFeatures = [
    {
      icon: Percent,
      title: "Скидки и промокоды",
      description: "Создавайте промокоды и автоматические скидки для привлечения клиентов",
      href: "/admin/discounts",
    },
    {
      icon: ClipboardList,
      title: "Управление заказами",
      description: "Все заказы в одном месте. Отслеживайте статусы, оплату и доставку",
      href: "/admin/orders",
    },
    {
      icon: MessageCircle,
      title: "Объявления",
      description: "Добавьте баннер-объявление на витрину для акций и новостей",
      href: "/admin/settings?tab=announcement",
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-guide-title">
          Гайд по старту
        </h1>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="text-guide-subtitle">
          Запустите свой магазин за 5 минут — следуйте этим шагам
        </p>
      </div>

      <Card className="p-5 border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/5" data-testid="card-guide-progress">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">Ваш прогресс</span>
          </div>
          <Badge variant="secondary" className="text-xs font-bold no-default-hover-elevate no-default-active-elevate" data-testid="badge-guide-progress">
            {completedCount} из {steps.length} выполнено
          </Badge>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.round((completedCount / steps.length) * 100)}%` }}
          />
        </div>
      </Card>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <Card key={step.title} className={`overflow-hidden ${step.completed ? "border-primary/20 dark:border-primary/30" : ""}`} data-testid={`card-guide-step-${idx + 1}`}>
            <div className="p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${step.completed ? "bg-primary" : step.bg}`}>
                  {step.completed ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`font-bold ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                      {step.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {step.time}
                    </div>
                    {step.completed && (
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 no-default-hover-elevate no-default-active-elevate">
                        Готово
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>

                  {!step.completed && (
                    <div className="mt-3 space-y-1.5">
                      {step.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {step.key === "share" ? (
                      <>
                        <Button variant="outline" className="rounded-full font-semibold" onClick={copyUrl} data-testid="button-guide-copy-url">
                          <Copy className="mr-1.5 h-4 w-4" />
                          Копировать ссылку
                        </Button>
                        <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="rounded-full font-semibold" data-testid="button-guide-open-store">
                            <ExternalLink className="mr-1.5 h-4 w-4" />
                            Открыть магазин
                          </Button>
                        </a>
                      </>
                    ) : (
                      <Link href={step.href} data-testid={`link-guide-${step.key || idx}`}>
                        <Button className={`rounded-full font-semibold ${step.completed ? "" : ""}`} variant={step.completed ? "outline" : "default"} data-testid={`button-guide-${step.key || idx}`}>
                          {step.completed ? "Перейти" : step.buttonText}
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="pt-2">
        <h2 className="text-lg font-extrabold tracking-tight mb-3" data-testid="text-bonus-title">
          Дополнительные возможности
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          После запуска магазина используйте эти инструменты для роста продаж
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {bonusFeatures.map((feature) => (
            <Link key={feature.title} href={feature.href}>
              <Card className="p-4 h-full hover-elevate" data-testid={`card-bonus-${feature.title}`}>
                <feature.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm font-bold">{feature.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
