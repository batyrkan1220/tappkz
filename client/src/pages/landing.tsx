import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Smartphone,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Globe,
  Menu,
  X,
  Star,
  ShoppingCart,
  Store,
  MapPin,
  Clock,
  Send,
  Bell,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useState } from "react";
import mockCream from "@/assets/images/mock-product-cream.jpg";
import mockSerum from "@/assets/images/mock-product-serum.jpg";
import mockFoundation from "@/assets/images/mock-product-foundation.jpg";
import mockBanner from "@/assets/images/mock-store-banner.jpg";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <ShoppingBag className="h-4.5 w-4.5 text-background" />
            </div>
            <span className="text-lg font-extrabold tracking-tight" data-testid="text-brand-name">TakeSale</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-features">Возможности</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-how">Как это работает</a>
            <a href="#pricing" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-pricing">Тарифы</a>
          </div>

          <div className="flex items-center gap-2.5">
            <a href="/login">
              <Button variant="ghost" size="sm" className="font-semibold" data-testid="button-login-nav">
                Войти
              </Button>
            </a>
            <a href="/register" className="hidden sm:block">
              <Button className="rounded-full font-semibold" data-testid="button-register-nav">
                Начать бесплатно
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t px-5 py-4 bg-white dark:bg-background space-y-1">
            <a href="#features" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-features">Возможности</a>
            <a href="#how-it-works" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-how">Как это работает</a>
            <a href="#pricing" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-pricing">Тарифы</a>
            <a href="/register" className="block pt-2">
              <Button className="w-full rounded-full font-semibold" data-testid="button-mobile-register">Начать бесплатно</Button>
            </a>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-8 md:pt-28 md:pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 dark:bg-background/80 px-4 py-1.5 mb-8 text-sm font-medium" data-testid="badge-whatsapp-partner">
              <SiWhatsapp className="h-4 w-4 text-[#25D366]" />
              <span>WhatsApp Business Partner</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[3.5rem]" data-testid="text-hero-heading">
              Создайте онлайн-магазин{" "}
              <span className="text-primary">для WhatsApp</span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
              Принимайте заказы, управляйте продажами и растите бизнес - всё через WhatsApp
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/register">
                <Button size="lg" className="rounded-full font-semibold" data-testid="button-hero-cta">
                  Начать бесплатно
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5" data-testid="text-check-free"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Бесплатно</span>
              <span className="flex items-center gap-1.5" data-testid="text-check-nocode"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Без кода</span>
              <span className="flex items-center gap-1.5" data-testid="text-check-fast"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Готово за 5 минут</span>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <div className="relative mx-auto w-[300px] rounded-[2.5rem] border-[8px] border-foreground/90 bg-white dark:bg-zinc-900 p-1.5 shadow-2xl" data-testid="mockup-phone">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-foreground/90 rounded-b-2xl z-10" />
              <div className="rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-2 px-3.5 pt-8 pb-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: "#e91e63" }}>
                      AB
                    </div>
                    <span className="text-[11px] font-extrabold tracking-tight">Arai Beauty</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-6 w-6 rounded-md flex items-center justify-center">
                      <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="h-6 w-6 rounded-md flex items-center justify-center relative">
                      <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#e91e63] text-[7px] text-white flex items-center justify-center font-bold">2</span>
                    </div>
                  </div>
                </div>

                <div className="h-20 w-full relative overflow-hidden">
                  <img src={mockBanner} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#e91e63" }}>
                      AB
                    </div>
                  </div>
                </div>
                <div className="text-center pt-1 pb-2">
                  <p className="text-[11px] font-extrabold tracking-tight">Arai Beauty</p>
                  <p className="text-[8px] text-muted-foreground flex items-center justify-center gap-0.5">
                    <MapPin className="h-2 w-2" /> Алматы
                  </p>
                </div>

                <div className="px-3 pb-2">
                  <div className="flex gap-1.5 overflow-hidden">
                    <span className="shrink-0 rounded-full bg-foreground text-background px-2.5 py-0.5 text-[9px] font-medium">Все</span>
                    <span className="shrink-0 rounded-full bg-muted text-foreground px-2.5 py-0.5 text-[9px] font-medium">Уход за лицом</span>
                    <span className="shrink-0 rounded-full bg-muted text-foreground px-2.5 py-0.5 text-[9px] font-medium">Макияж</span>
                  </div>
                </div>

                <div className="px-3 pb-2 space-y-2">
                  {[
                    { name: "Увлажняющий крем", desc: "Дневной крем с гиалуроновой кислотой", price: "4 500", old: "5 200", img: mockCream },
                    { name: "Сыворотка витамин C", desc: "Антиоксидантная сыворотка для сияния", price: "7 800", img: mockSerum },
                    { name: "Тональный крем", desc: "SPF 30, натуральный финиш", price: "6 200", img: mockFoundation },
                  ].map((item, i) => (
                    <div key={i} className="flex rounded-md border border-border/50 bg-card" data-testid={`mockup-product-${i}`}>
                      <div className="flex-1 p-2.5 pr-1">
                        <p className="text-[10px] font-semibold leading-tight">{item.name}</p>
                        <p className="text-[8px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{item.desc}</p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="text-[10px] font-bold" style={{ color: "#e91e63" }}>{item.price} ₸</span>
                          {item.old && <span className="text-[8px] text-muted-foreground line-through">{item.old} ₸</span>}
                        </div>
                      </div>
                      <div className="w-[72px] shrink-0 overflow-hidden rounded-r-md bg-muted">
                        <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-3 pb-3">
                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-2 text-white">
                    <SiWhatsapp className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold">Заказать в WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-features-heading">
              Упростите заказы через WhatsApp
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Меньше ошибок, быстрее сделки, больше продаж
            </p>
          </div>

          <div className="grid gap-16 lg:gap-24">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <Badge variant="secondary" className="mb-4 rounded-full font-semibold">Заказы</Badge>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-orders">
                  Чистые заказы без путаницы
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Клиенты собирают корзину, указывают контакты и отправляют готовый заказ прямо в ваш WhatsApp. Никаких потерянных сообщений и уточнений.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Автоматическое формирование заказа", "Имя, телефон, адрес в одном сообщении", "Сумма и список товаров сразу видны", "Инвойс/чек для каждого заказа"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="p-6 lg:p-8" data-testid="card-feature-orders">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/10">
                      <SiWhatsapp className="h-4 w-4 text-[#25D366]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" data-testid="text-order-number">Новый заказ #142</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Айгерим К. · +7 701 ***-**-45</p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>1x Увлажняющий крем - 4 500 ₸</p>
                        <p>2x Сыворотка витамин C - 15 600 ₸</p>
                      </div>
                      <p className="mt-2 text-sm font-bold">Итого: 20 100 ₸</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Ожидает</Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Оплачен</Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Доставлен</Badge>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-2">
              <Card className="p-6 lg:p-8 lg:order-first order-last" data-testid="card-feature-catalog">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden"><img src={mockCream} alt="" className="h-full w-full object-cover" /></div>
                      <div>
                        <p className="text-sm font-semibold">Увлажняющий крем</p>
                        <p className="text-xs text-muted-foreground">Уход за лицом</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#e91e63" }}>4 500 ₸</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden"><img src={mockSerum} alt="" className="h-full w-full object-cover" /></div>
                      <div>
                        <p className="text-sm font-semibold">Сыворотка витамин C</p>
                        <p className="text-xs text-muted-foreground">Уход за лицом</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#e91e63" }}>7 800 ₸</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden"><img src={mockFoundation} alt="" className="h-full w-full object-cover" /></div>
                      <div>
                        <p className="text-sm font-semibold">Тональный крем</p>
                        <p className="text-xs text-muted-foreground">Макияж</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#e91e63" }}>6 200 ₸</p>
                  </div>
                </div>
              </Card>
              <div>
                <Badge variant="secondary" className="mb-4 rounded-full font-semibold">Каталог</Badge>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-catalog">
                  Красивый магазин за минуты
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Добавьте товары, загрузите фото, настройте цвета и логотип. Ваш магазин готов - поделитесь ссылкой в Instagram, WhatsApp или где угодно.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Категории и каталог товаров с фото", "Логотип, баннер, фирменные цвета", "Адаптивный мобильный дизайн", "Ссылка-визитка для Instagram Bio"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <Badge variant="secondary" className="mb-4 rounded-full font-semibold">Управление</Badge>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-manage">
                  Управляйте заказами онлайн
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Отслеживайте статусы заказов, контролируйте оплату и доставку. Вся клиентская база и аналитика в одном месте.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Статусы: новый, подтверждён, выполнен", "Контроль оплаты и доставки", "База клиентов с историей покупок", "Графики продаж и аналитика"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="p-6 lg:p-8" data-testid="card-feature-manage">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3 text-center" data-testid="text-stat-orders">
                      <p className="text-2xl font-extrabold tracking-tight">247</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Заказов</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center" data-testid="text-stat-revenue">
                      <p className="text-2xl font-extrabold tracking-tight">1.2M</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Выручка ₸</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center" data-testid="text-stat-clients">
                      <p className="text-2xl font-extrabold tracking-tight">89</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Клиентов</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center" data-testid="text-stat-views">
                      <p className="text-2xl font-extrabold tracking-tight">4.8K</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Просмотров</p>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold">Продажи за неделю</p>
                      <Badge variant="secondary" className="text-[10px]">+23%</Badge>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {[35, 52, 41, 68, 55, 72, 80].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-primary/20" style={{ height: `${h}%` }}>
                          <div className="w-full rounded-sm bg-primary" style={{ height: `${Math.min(100, h + 10)}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/30 dark:bg-muted/10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Smartphone, title: "26 типов бизнеса", desc: "Еда, торговля, услуги - платформа адаптируется", tid: "business-types" },
              { icon: Clock, title: "5 минут", desc: "Время от регистрации до готового магазина", tid: "setup-time" },
              { icon: Globe, title: "Ссылка-визитка", desc: "Поделитесь в Instagram, WhatsApp, визитке", tid: "share-link" },
              { icon: BarChart3, title: "Аналитика", desc: "Просмотры, заказы, выручка в реальном времени", tid: "analytics" },
            ].map((item) => (
              <div key={item.title} className="text-center" data-testid={`stat-${item.tid}`}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/5">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-extrabold tracking-tight">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-how-heading">
              Как это работает
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Три шага от идеи до первого заказа
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Создайте магазин",
                desc: "Зарегистрируйтесь, выберите тип бизнеса, добавьте товары и настройте дизайн",
                icon: Store,
              },
              {
                step: "2",
                title: "Поделитесь ссылкой",
                desc: "Отправьте ссылку магазина клиентам через Instagram, WhatsApp или любой канал",
                icon: Send,
              },
              {
                step: "3",
                title: "Принимайте заказы",
                desc: "Получайте готовые заказы в WhatsApp, управляйте ими в панели администратора",
                icon: Bell,
              },
            ].map((step) => (
              <Card key={step.step} className="relative p-6 text-center" data-testid={`card-step-${step.step}`}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <div className="mt-4 mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/5">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </Card>
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
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: "Айгерим К.",
                role: "Косметика",
                text: "Раньше заказы терялись в переписке. Теперь клиенты сами выбирают товары и отправляют готовый заказ. Экономлю 3 часа в день!",
              },
              {
                name: "Марат Т.",
                role: "Доставка еды",
                text: "Запустил магазин за один вечер. Клиенты довольны - всё понятно, удобно, красиво. Заказов стало в 2 раза больше.",
              },
              {
                name: "Динара С.",
                role: "Одежда",
                text: "Идеальное решение для Instagram-бизнеса. Ставлю ссылку в шапку профиля и покупатели сразу видят весь каталог с ценами.",
              },
            ].map((t, i) => (
              <Card key={i} className="p-6" data-testid={`card-testimonial-${i}`}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="border-t pt-4">
                  <p className="text-sm font-bold">{t.name}</p>
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
                features: ["Мобильный магазин", "WhatsApp заказы", "Базовая аналитика", "Брендирование", "Управление заказами", "База клиентов"],
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

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <div className="rounded-3xl bg-primary p-10 md:p-16 text-primary-foreground">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-cta-heading">
              Готовы начать продавать?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-primary-foreground/80 leading-relaxed">
              Создайте магазин бесплатно и начните принимать заказы через WhatsApp уже сегодня
            </p>
            <div className="mt-8">
              <a href="/register">
                <Button size="lg" className="bg-white text-primary rounded-full font-semibold" data-testid="button-cta-bottom">
                  Начать бесплатно
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
              <a href="#features" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-features">Возможности</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-how">Как это работает</a>
              <a href="#pricing" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-pricing">Тарифы</a>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-footer-copyright">
              TakeSale 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
