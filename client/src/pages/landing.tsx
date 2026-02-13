import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  MessageCircle,
  Smartphone,
  Palette,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Menu,
  X,
  Star,
  ShoppingCart,
  Users,
  CreditCard,
  FolderOpen,
  Settings,
  LineChart,
  Store,
  Truck,
  Receipt,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useState } from "react";

const steps = [
  {
    num: "01",
    title: "Создайте магазин",
    desc: "Выберите тип бизнеса, добавьте категории и товары с фото. Настройте брендинг за 5 минут",
    icon: ShoppingBag,
  },
  {
    num: "02",
    title: "Поделитесь ссылкой",
    desc: "Отправьте ссылку витрины в Instagram, мессенджерах или на визитке",
    icon: Globe,
  },
  {
    num: "03",
    title: "Управляйте продажами",
    desc: "Принимайте заказы через WhatsApp и Kaspi, отслеживайте аналитику и клиентов",
    icon: LineChart,
  },
];

const features = [
  {
    icon: Smartphone,
    title: "Мобильная витрина",
    desc: "Адаптивный дизайн для смартфонов. 90% ваших клиентов покупают с телефона",
  },
  {
    icon: Palette,
    title: "Полный брендинг",
    desc: "Логотип, баннер, цвета, стили кнопок и карточек. Витрина выглядит как ваш бренд",
  },
  {
    icon: FolderOpen,
    title: "Категории и каталог",
    desc: "Организуйте товары по категориям. Фото, цены, скидки, описание для каждой позиции",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp-чекаут",
    desc: "Клиент собирает корзину и отправляет готовый заказ с деталями прямо в WhatsApp",
  },
  {
    icon: CreditCard,
    title: "Kaspi оплата",
    desc: "Подключите Kaspi Pay для онлайн-оплаты. Клиенты платят удобным способом",
  },
  {
    icon: ShoppingCart,
    title: "Управление заказами",
    desc: "Статусы, оплата, доставка, заметки. Полный контроль каждого заказа в панели",
  },
  {
    icon: Users,
    title: "База клиентов",
    desc: "Автоматический сбор клиентов из заказов. История покупок и контакты",
  },
  {
    icon: BarChart3,
    title: "Детальная аналитика",
    desc: "Графики продаж, просмотров, конверсий. Отчёты по периодам и товарам",
  },
  {
    icon: Store,
    title: "26 типов бизнеса",
    desc: "Еда, торговля, услуги. Платформа подстраивается под вашу нишу: меню, товары или услуги",
  },
];

const testimonials = [
  {
    name: "Айгерим К.",
    role: "Косметика, Алматы",
    text: "Раньше заказы терялись в переписке. Теперь клиенты сами выбирают товары и отправляют готовый заказ. Экономлю 3 часа в день!",
    rating: 5,
  },
  {
    name: "Марат Т.",
    role: "Еда на дом, Астана",
    text: "Запустил витрину за один вечер. Клиенты довольны, заказов стало в 2 раза больше. Kaspi оплата очень удобна.",
    rating: 5,
  },
  {
    name: "Динара С.",
    role: "Одежда, Шымкент",
    text: "Идеальное решение для Instagram-бизнеса. Ставлю ссылку в шапку профиля и покупатели сразу видят весь каталог с ценами.",
    rating: 5,
  },
];

const adminFeatures = [
  { icon: Receipt, label: "Заказы и статусы" },
  { icon: Users, label: "База клиентов" },
  { icon: LineChart, label: "Графики и отчёты" },
  { icon: CreditCard, label: "Kaspi Pay" },
  { icon: Palette, label: "Брендинг" },
  { icon: Truck, label: "Статус доставки" },
  { icon: FolderOpen, label: "Категории" },
  { icon: Settings, label: "Настройки" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <ShoppingBag className="h-4.5 w-4.5 text-background" />
            </div>
            <span className="text-lg font-extrabold tracking-tight" data-testid="text-brand-name">TakeSale</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-how">Как это работает</a>
            <a href="#features" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-features">Возможности</a>
            <a href="#admin" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-admin">Панель управления</a>
            <a href="#pricing" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-pricing">Тарифы</a>
          </div>

          <div className="flex items-center gap-2.5">
            <a href="/login">
              <Button variant="ghost" className="font-semibold text-sm" data-testid="button-login-nav">
                Войти
              </Button>
            </a>
            <a href="/register" className="hidden sm:block">
              <Button className="rounded-full font-semibold" data-testid="button-register-nav">
                Начать бесплатно
              </Button>
            </a>
            <button
              className="md:hidden p-1.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t px-5 py-4 bg-white dark:bg-background space-y-1">
            <a href="#how-it-works" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-how">Как это работает</a>
            <a href="#features" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-features">Возможности</a>
            <a href="#admin" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-admin">Панель управления</a>
            <a href="#pricing" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-pricing">Тарифы</a>
            <a href="/register" className="block pt-2">
              <Button className="w-full rounded-full font-semibold" data-testid="button-mobile-register">Начать бесплатно</Button>
            </a>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3 dark:from-primary/5 dark:via-background dark:to-primary/3" />
        <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />
        <div className="absolute -bottom-20 -left-32 h-80 w-80 rounded-full bg-primary/8 blur-3xl dark:bg-primary/3" />

        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 dark:bg-background/80 px-4 py-2 mb-7">
              <SiWhatsapp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold">
                Витрина + WhatsApp + Kaspi = Продажи
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl" data-testid="text-hero-heading">
              Полноценный магазин
              <span className="block mt-1 text-primary">
                в кармане каждого клиента
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
              Создайте витрину, управляйте заказами, принимайте оплату через Kaspi, ведите клиентскую базу и анализируйте продажи - всё в одном месте.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/register">
                <Button size="lg" className="rounded-full font-semibold" data-testid="button-hero-cta">
                  Создать магазин бесплатно
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#admin">
                <Button size="lg" variant="outline" className="rounded-full font-semibold" data-testid="button-hero-demo">
                  Посмотреть возможности
                </Button>
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5" data-testid="text-check-free"><CheckCircle2 className="h-4 w-4 text-primary" /> Бесплатно</span>
              <span className="flex items-center gap-1.5" data-testid="text-check-nocode"><CheckCircle2 className="h-4 w-4 text-primary" /> Без кода</span>
              <span className="flex items-center gap-1.5" data-testid="text-check-fast"><CheckCircle2 className="h-4 w-4 text-primary" /> За 5 минут</span>
              <span className="flex items-center gap-1.5" data-testid="text-check-kaspi"><CheckCircle2 className="h-4 w-4 text-primary" /> Kaspi Pay</span>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <div className="relative mx-auto w-[280px] rounded-[2.5rem] border-[8px] border-foreground/90 bg-white dark:bg-zinc-900 p-1.5 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-foreground/90 rounded-b-2xl" />
              <div className="rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900">
                <div className="bg-primary px-4 pt-8 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Ваш магазин</p>
                      <p className="text-white/70 text-[10px]">Ваш бренд</p>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-3 space-y-2">
                  {["Товар 1", "Товар 2", "Товар 3"].map((name, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="h-16 w-16 rounded-lg bg-primary/10 dark:bg-primary/5 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold truncate">{name}</p>
                        <p className="text-[10px] text-muted-foreground">Описание</p>
                        <p className="text-[11px] font-bold text-primary mt-1">{[5000, 8500, 3200][i].toLocaleString("ru-RU")} ₸</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 pb-3">
                  <div className="flex items-center justify-center gap-2 rounded-full bg-green-600 py-2.5 text-white">
                    <SiWhatsapp className="h-4 w-4" />
                    <span className="text-xs font-bold">Заказать в WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-b bg-muted/30 dark:bg-muted/10">
        <div className="mx-auto max-w-5xl px-5 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Для бизнеса в Казахстане</span>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {["Алматы", "Астана", "Шымкент", "Караганда", "Актобе"].map((city) => (
              <Badge key={city} variant="outline" className="font-semibold rounded-full" data-testid={`badge-city-${city}`}>{city}</Badge>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 rounded-full font-semibold" data-testid="badge-how-it-works">Просто как 1-2-3</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-how-heading">
              Как это работает
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Три простых шага от идеи до первого заказа
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num} className="relative text-center md:text-left">
                <div className="mx-auto md:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/5">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-5xl font-extrabold text-muted/80 dark:text-muted/40 absolute -top-2 right-4 md:right-auto md:-left-2 select-none">{step.num}</span>
                <h3 className="text-lg font-extrabold tracking-tight mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28 bg-muted/20 dark:bg-muted/5">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-features-heading">
              Всё для вашего бизнеса
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Мощные инструменты продаж в простом и удобном интерфейсе
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="group p-6 hover-elevate" data-testid={`card-feature-${f.title}`}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/5 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-extrabold tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="admin" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 rounded-full font-semibold" data-testid="badge-admin">Панель управления</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-admin-heading">
              Полный контроль бизнеса
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Удобная панель администратора с аналитикой, заказами, клиентами и настройками
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6" data-testid="card-admin-orders">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/5">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold tracking-tight">Заказы и доставка</h3>
                  <p className="text-xs text-muted-foreground">Полное управление заказами</p>
                </div>
              </div>
              <ul className="space-y-2">
                {["Статусы заказа: новый, подтверждён, завершён", "Контроль оплаты и доставки", "Внутренние заметки к заказам", "Автосоздание клиентов из заказов"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6" data-testid="card-admin-analytics">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/5">
                  <LineChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold tracking-tight">Аналитика и отчёты</h3>
                  <p className="text-xs text-muted-foreground">Данные для принятия решений</p>
                </div>
              </div>
              <ul className="space-y-2">
                {["Графики просмотров, продаж и заказов", "Отчёты по периодам (7/30/90 дней)", "Топ товаров по выручке", "Конверсия посетителей в покупателей"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6" data-testid="card-admin-payments">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/5">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold tracking-tight">Приём оплаты</h3>
                  <p className="text-xs text-muted-foreground">WhatsApp + Kaspi Pay</p>
                </div>
              </div>
              <ul className="space-y-2">
                {["Заказ через WhatsApp с деталями", "Онлайн-оплата через Kaspi Pay", "Настраиваемый шаблон сообщений", "Инвойс/чек для каждого заказа"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6" data-testid="card-admin-branding">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/5">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold tracking-tight">Брендинг и дизайн</h3>
                  <p className="text-xs text-muted-foreground">Ваш стиль без дизайнера</p>
                </div>
              </div>
              <ul className="space-y-2">
                {["Логотип, баннер и фирменные цвета", "Стили кнопок, карточек и шрифтов", "Оверлей баннера для читаемости", "Витрина с вашим брендом, не TakeSale"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {adminFeatures.map((af) => (
              <div key={af.label} className="flex items-center gap-2.5 rounded-md border p-3">
                <af.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{af.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-muted/20 dark:bg-muted/5">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-reviews-heading">
              Что говорят продавцы
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Реальные истории предпринимателей из Казахстана
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="p-6" data-testid={`card-testimonial-${i}`}>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-pricing-heading">
            Простые тарифы
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Начните бесплатно - масштабируйтесь когда будете готовы
          </p>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
            {[
              {
                name: "Старт",
                price: "0 ₸",
                period: "навсегда",
                products: "до 30 товаров",
                features: ["Мобильная витрина", "WhatsApp заказы", "Kaspi оплата", "Базовая аналитика", "Брендирование", "Управление заказами", "База клиентов"],
                highlight: false,
                cta: "Начать бесплатно",
                enabled: true,
              },
              {
                name: "Бизнес",
                price: "4 990 ₸",
                period: "/мес",
                products: "до 300 товаров",
                features: ["Всё из Старт", "Расширенная аналитика", "Приоритетная поддержка", "Свой домен", "Экспорт данных"],
                highlight: true,
                cta: "Скоро",
                enabled: false,
              },
              {
                name: "Про",
                price: "9 990 ₸",
                period: "/мес",
                products: "до 2000 товаров",
                features: ["Всё из Бизнес", "Несколько магазинов", "API доступ", "Менеджер аккаунта", "Интеграции"],
                highlight: false,
                cta: "Скоро",
                enabled: false,
              },
            ].map((plan) => (
              <Card
                key={plan.name}
                className={`relative p-6 text-left ${plan.highlight ? "border-primary border-2" : ""}`}
                data-testid={`card-pricing-${plan.name}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="rounded-full font-semibold no-default-hover-elevate no-default-active-elevate" data-testid="badge-popular">
                      Популярный
                    </Badge>
                  </div>
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.products}</p>

                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {plan.enabled ? (
                    <a href="/register" className="block">
                      <Button className="w-full rounded-full font-semibold" data-testid="button-pricing-start">
                        {plan.cta}
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" className="w-full rounded-full font-semibold" disabled data-testid={`button-pricing-${plan.name}`}>
                      {plan.cta}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-muted/20 dark:bg-muted/5">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <div className="rounded-3xl bg-primary p-10 md:p-16 text-primary-foreground">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-cta-heading">
              Готовы начать продавать?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-primary-foreground/80 leading-relaxed">
              Присоединяйтесь к предпринимателям Казахстана, которые уже продают через TakeSale
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/register">
                <Button size="lg" className="bg-white text-primary rounded-full font-semibold" data-testid="button-cta-bottom">
                  Создать магазин бесплатно
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/60">
              Бесплатно навсегда. Без кредитной карты.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
                <ShoppingBag className="h-3.5 w-3.5 text-background" />
              </div>
              <span className="text-sm font-extrabold tracking-tight">TakeSale</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <a href="#how-it-works" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-how">Как это работает</a>
              <a href="#features" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-features">Возможности</a>
              <a href="#admin" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-admin">Панель управления</a>
              <a href="#pricing" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-pricing">Тарифы</a>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-footer-copyright">
              TakeSale 2026. Сделано в Казахстане.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
