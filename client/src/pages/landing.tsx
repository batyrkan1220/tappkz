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
import mockPlov from "@/assets/images/mock-food-plov.png";
import mockLagman from "@/assets/images/mock-food-lagman.png";
import mockShashlik from "@/assets/images/mock-food-shashlik.png";
import mockBanner from "@/assets/images/mock-restaurant-banner.png";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShoppingBag className="h-4 w-4 text-primary-foreground" />
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
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent dark:from-primary/[0.04]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.07] blur-[120px] dark:bg-primary/[0.04]" />
        <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-8 md:pt-28 md:pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] dark:bg-primary/[0.08] px-4 py-1.5 mb-8 text-sm font-medium text-primary" data-testid="badge-whatsapp-partner">
              <SiWhatsapp className="h-4 w-4" />
              <span>WhatsApp Business Partner</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[3.5rem]" data-testid="text-hero-heading">
              Создайте онлайн-магазин{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">для WhatsApp</span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
              Принимайте заказы, управляйте продажами и растите бизнес — всё через WhatsApp
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/register">
                <Button size="lg" className="rounded-full font-semibold shadow-lg shadow-primary/25" data-testid="button-hero-cta">
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
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-[3rem] blur-2xl" />
              <div className="relative mx-auto w-[300px] rounded-[2.5rem] border-[8px] border-foreground/90 bg-white dark:bg-zinc-900 p-1.5 shadow-2xl" data-testid="mockup-phone">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-foreground/90 rounded-b-2xl z-10" />
                <div className="rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="flex items-center justify-between gap-2 px-3.5 pt-8 pb-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold bg-primary">
                        DA
                      </div>
                      <span className="text-[11px] font-extrabold tracking-tight">Достархан</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center">
                        <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="h-6 w-6 rounded-md flex items-center justify-center relative">
                        <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary text-[7px] text-white flex items-center justify-center font-bold">3</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-20 w-full relative overflow-hidden">
                    <img src={mockBanner} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/30" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-sm font-bold bg-primary">
                        DA
                      </div>
                    </div>
                  </div>
                  <div className="text-center pt-1 pb-2">
                    <p className="text-[11px] font-extrabold tracking-tight">Достархан</p>
                    <p className="text-[8px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <MapPin className="h-2 w-2" /> Алматы
                    </p>
                  </div>

                  <div className="px-3 pb-2">
                    <div className="flex gap-1.5 overflow-hidden">
                      <span className="shrink-0 rounded-full bg-foreground text-background px-2.5 py-0.5 text-[9px] font-medium">Все</span>
                      <span className="shrink-0 rounded-full bg-muted text-foreground px-2.5 py-0.5 text-[9px] font-medium">Горячее</span>
                      <span className="shrink-0 rounded-full bg-muted text-foreground px-2.5 py-0.5 text-[9px] font-medium">Шашлыки</span>
                    </div>
                  </div>

                  <div className="px-3 pb-2 space-y-2">
                    {[
                      { name: "Плов по-узбекски", desc: "Баранина, рис девзира, морковь, специи", price: "2 800", old: "3 200", img: mockPlov },
                      { name: "Лагман домашний", desc: "Говядина, домашняя лапша, овощи", price: "2 200", img: mockLagman },
                      { name: "Шашлык из баранины", desc: "Маринад на углях, лук, зелень", price: "3 500", img: mockShashlik },
                    ].map((item, i) => (
                      <div key={i} className="flex rounded-md border border-border/50 bg-card" data-testid={`mockup-product-${i}`}>
                        <div className="flex-1 p-2.5 pr-1">
                          <p className="text-[10px] font-semibold leading-tight">{item.name}</p>
                          <p className="text-[8px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{item.desc}</p>
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className="text-[10px] font-bold text-primary">{item.price} ₸</span>
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
        </div>
      </section>

      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4 rounded-full font-semibold" data-testid="badge-features-label">Возможности</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-features-heading">
              Упростите заказы через WhatsApp
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Меньше ошибок, быстрее сделки, больше продаж
            </p>
          </div>

          <div className="grid gap-20 lg:gap-28">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-3 py-1 mb-5">
                  <SiWhatsapp className="h-3.5 w-3.5 text-[#25D366]" />
                  <span className="text-xs font-semibold text-[#25D366]">WhatsApp</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-orders">
                  Чистые заказы без путаницы
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Клиенты собирают корзину, указывают контакты и отправляют готовый заказ прямо в ваш WhatsApp. Никаких потерянных сообщений.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Автоматическое формирование заказа", "Имя, телефон, адрес в одном сообщении", "Сумма и список товаров сразу видны", "Инвойс/чек для каждого заказа"].map((item, i) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" data-testid={`text-order-feature-${i}`}>
                      <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="p-6 lg:p-8 bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60" data-testid="card-feature-orders">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl bg-[#25D366]/[0.06] dark:bg-[#25D366]/[0.08] border border-[#25D366]/15 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15">
                      <SiWhatsapp className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" data-testid="text-order-number">Новый заказ #142</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Айгерим К. · +7 701 ***-**-45</p>
                      <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                        <p>2x Плов по-узбекски — 5 600 ₸</p>
                        <p>1x Шашлык из баранины — 3 500 ₸</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-bold">Итого: 9 100 ₸</p>
                        <Badge variant="secondary" className="bg-[#25D366]/15 text-[#25D366] border-[#25D366]/20 text-[10px]">Новый</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Ожидает</Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Оплачен</Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Доставлен</Badge>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-2">
              <Card className="p-6 lg:p-8 lg:order-first order-last bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60" data-testid="card-feature-catalog">
                <div className="space-y-3">
                  {[
                    { name: "Плов по-узбекски", cat: "Горячее", price: "2 800 ₸", img: mockPlov },
                    { name: "Лагман домашний", cat: "Горячее", price: "2 200 ₸", img: mockLagman },
                    { name: "Шашлык из баранины", cat: "Шашлыки", price: "3 500 ₸", img: mockShashlik },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl border p-3" data-testid={`catalog-item-${i}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden shrink-0"><img src={item.img} alt="" className="h-full w-full object-cover" /></div>
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.cat}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-primary shrink-0">{item.price}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-5">
                  <Store className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Каталог</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-catalog">
                  Красивое меню за минуты
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Добавьте блюда, загрузите фото, настройте цвета и логотип. Ваше меню готово — поделитесь ссылкой в Instagram, WhatsApp или на визитке.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Категории и каталог блюд с фото", "Логотип, баннер, фирменные цвета", "Адаптивный мобильный дизайн", "Ссылка-визитка для Instagram Bio"].map((item, i) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" data-testid={`text-catalog-feature-${i}`}>
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-chart-3/10 px-3 py-1 mb-5">
                  <BarChart3 className="h-3.5 w-3.5 text-chart-3" />
                  <span className="text-xs font-semibold text-chart-3">Аналитика</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-manage">
                  Управляйте заказами онлайн
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Отслеживайте статусы заказов, контролируйте оплату и доставку. Вся клиентская база и аналитика в одном месте.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Статусы: новый, подтверждён, выполнен", "Контроль оплаты и доставки", "База клиентов с историей покупок", "Графики продаж и аналитика"].map((item, i) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" data-testid={`text-manage-feature-${i}`}>
                      <CheckCircle2 className="h-4 w-4 text-chart-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="p-6 lg:p-8 bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60" data-testid="card-feature-manage">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "247", label: "Заказов", tid: "orders", color: "text-primary" },
                      { val: "1.2M ₸", label: "Выручка", tid: "revenue", color: "text-chart-3" },
                      { val: "89", label: "Клиентов", tid: "clients", color: "text-chart-2" },
                      { val: "4.8K", label: "Просмотров", tid: "views", color: "text-chart-4" },
                    ].map((s) => (
                      <div key={s.tid} className="rounded-xl border p-3.5 text-center" data-testid={`text-stat-${s.tid}`}>
                        <p className={`text-2xl font-extrabold tracking-tight ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="text-xs font-semibold">Продажи за неделю</p>
                      <Badge variant="secondary" className="bg-chart-3/10 text-chart-3 text-[10px]">+23%</Badge>
                    </div>
                    <div className="flex items-end gap-1.5 h-14">
                      {[35, 52, 41, 68, 55, 72, 80].map((h, i) => (
                        <div key={i} className="flex-1 rounded-md bg-primary/15 dark:bg-primary/10" style={{ height: `${h}%` }}>
                          <div className="w-full h-full rounded-md bg-gradient-to-t from-primary to-primary/70" />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between gap-1 mt-1.5">
                      {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
                        <span key={d} className="flex-1 text-center text-[9px] text-muted-foreground">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-primary/[0.08] to-primary/[0.04] dark:from-primary/[0.03] dark:via-primary/[0.06] dark:to-primary/[0.03]" />
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Smartphone, title: "26 типов бизнеса", desc: "Еда, торговля, услуги — платформа адаптируется", tid: "business-types" },
              { icon: Clock, title: "5 минут", desc: "Время от регистрации до готового магазина", tid: "setup-time" },
              { icon: Globe, title: "Ссылка-визитка", desc: "Поделитесь в Instagram, WhatsApp, визитке", tid: "share-link" },
              { icon: BarChart3, title: "Аналитика", desc: "Просмотры, заказы, выручка в реальном времени", tid: "analytics" },
            ].map((item) => (
              <div key={item.title} className="text-center" data-testid={`stat-${item.tid}`}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/15">
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
            <Badge variant="secondary" className="mb-4 rounded-full font-semibold" data-testid="badge-how-label">Просто как 1-2-3</Badge>
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
                gradient: "from-primary to-primary/70",
              },
              {
                step: "2",
                title: "Поделитесь ссылкой",
                desc: "Отправьте ссылку магазина клиентам через Instagram, WhatsApp или любой канал",
                icon: Send,
                gradient: "from-chart-3 to-chart-3/70",
              },
              {
                step: "3",
                title: "Принимайте заказы",
                desc: "Получайте готовые заказы в WhatsApp, управляйте ими в панели администратора",
                icon: Bell,
                gradient: "from-chart-2 to-chart-2/70",
              },
            ].map((step) => (
              <Card key={step.step} className="relative p-6 pt-8 text-center" data-testid={`card-step-${step.step}`}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} text-white text-sm font-bold shadow-lg`}>
                    {step.step}
                  </div>
                </div>
                <div className="mt-2 mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.07] dark:bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-muted/30 dark:bg-muted/10">
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
                role: "Кондитерская",
                text: "Раньше заказы терялись в переписке. Теперь клиенты сами выбирают торты и отправляют готовый заказ. Экономлю 3 часа в день!",
              },
              {
                name: "Марат Т.",
                role: "Ресторан доставки",
                text: "Запустил меню за один вечер. Клиенты довольны — всё понятно, удобно, красиво. Заказов стало в 2 раза больше.",
              },
              {
                name: "Динара С.",
                role: "Магазин одежды",
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
                <div className="border-t pt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <Badge variant="secondary" className="mb-4 rounded-full font-semibold" data-testid="badge-pricing-label">Тарифы</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-pricing-heading">
            Простые тарифы
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Начните бесплатно — масштабируйтесь когда будете готовы
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
            ].map((plan, planIdx) => (
              <Card
                key={plan.name}
                className={`relative p-6 text-left ${plan.highlight ? "border-primary border-2 shadow-lg shadow-primary/10" : ""}`}
                data-testid={`card-pricing-${planIdx}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="rounded-full font-semibold no-default-hover-elevate no-default-active-elevate shadow-md" data-testid="badge-popular">
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
                  {plan.features.map((f, fIdx) => (
                    <li key={f} className="flex items-start gap-2 text-sm" data-testid={`text-pricing-feature-${planIdx}-${fIdx}`}>
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
                    <Button variant="outline" className="w-full rounded-full font-semibold" disabled data-testid={`button-pricing-${planIdx}`}>
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
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative p-10 md:p-16 text-primary-foreground">
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-cta-heading">
                Готовы начать продавать?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-primary-foreground/80 leading-relaxed">
                Создайте магазин бесплатно и начните принимать заказы через WhatsApp уже сегодня
              </p>
              <div className="mt-8">
                <a href="/register">
                  <Button size="lg" className="bg-white text-primary rounded-full font-semibold shadow-xl" data-testid="button-cta-bottom">
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
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <ShoppingBag className="h-3.5 w-3.5 text-primary-foreground" />
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
