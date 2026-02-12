import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Store, ShoppingBag, MessageCircle, Smartphone, Palette, BarChart3, Menu } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useState } from "react";

const features = [
  {
    icon: Store,
    title: "Создайте магазин",
    desc: "Настройте витрину за 5 минут — название, логотип, цвета бренда",
  },
  {
    icon: ShoppingBag,
    title: "Каталог товаров",
    desc: "Категории, фото, цены в тенге — всё для удобства покупателей",
  },
  {
    icon: MessageCircle,
    title: "Заказы в WhatsApp",
    desc: "Клиент собирает корзину и отправляет заказ прямо вам в WhatsApp",
  },
  {
    icon: Smartphone,
    title: "Мобильная витрина",
    desc: "Оптимизирована для телефонов — 90% ваших клиентов с мобильных",
  },
  {
    icon: Palette,
    title: "Брендирование",
    desc: "Логотип, баннер, фирменный цвет — ваш стиль, ваш магазин",
  },
  {
    icon: BarChart3,
    title: "Аналитика",
    desc: "Просмотры, клики, популярные товары — контролируйте продажи",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight" data-testid="text-brand-name">TakeSale</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/login">
              <Button
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5 text-sm font-semibold"
                data-testid="button-login"
              >
                Начать бесплатно
              </Button>
            </a>
            <button
              className="lg:hidden p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t px-4 py-3 bg-white dark:bg-background space-y-2">
            <a href="#features" className="block text-sm text-muted-foreground py-1" onClick={() => setMobileMenuOpen(false)}>Возможности</a>
            <a href="#pricing" className="block text-sm text-muted-foreground py-1" onClick={() => setMobileMenuOpen(false)}>Тарифы</a>
            <a href="/s/arai-beauty" className="block text-sm text-muted-foreground py-1" onClick={() => setMobileMenuOpen(false)}>Демо магазин</a>
          </div>
        )}
      </nav>

      <section className="mx-auto max-w-3xl px-4 pt-12 pb-10 md:pt-20 md:pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-950/30 px-4 py-1.5 mb-8">
          <SiWhatsapp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            WhatsApp <span className="text-orange-500 font-semibold">Official</span> Partner
          </span>
        </div>

        <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-[3.5rem]">
          Создайте онлайн-магазин для WhatsApp
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground leading-relaxed md:text-lg">
          Принимайте заказы и оплаты онлайн<br />
          Меньше ошибок, быстрее сделки
        </p>

        <div className="mt-8">
          <a href="/api/login">
            <Button
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-base font-semibold"
              data-testid="button-get-started"
            >
              Начать бесплатно
            </Button>
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-60">
          <span className="text-sm font-bold tracking-tight text-foreground">Meta</span>
          <span className="text-sm font-bold tracking-tight text-foreground">WhatsApp</span>
          <span className="text-sm font-bold tracking-tight text-foreground">Kazakhstan</span>
          <span className="text-sm font-bold tracking-tight text-foreground">TechCrunch</span>
        </div>
      </section>

      <section className="bg-muted/30 dark:bg-muted/10 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-[2.75rem]">
            Упростите заказы через WhatsApp
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Всё что нужно для продажи товаров через мессенджер — от витрины до корзины
          </p>
        </div>
      </section>

      <section id="features" className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Всё для вашего бизнеса
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Простой и мощный инструмент для продаж через мессенджер
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="hover-elevate p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <f.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-muted/30 dark:bg-muted/10 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Тарифы
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Начните бесплатно, расширяйтесь по мере роста
          </p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { name: "Free", price: "Бесплатно", products: "до 30 товаров", highlight: true },
              { name: "Pro", price: "Скоро", products: "до 300 товаров", highlight: false },
              { name: "Business", price: "Скоро", products: "до 2000 товаров", highlight: false },
            ].map((plan) => (
              <Card key={plan.name} className={`p-6 text-left ${plan.highlight ? "border-foreground/20" : ""}`}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{plan.name}</h3>
                <p className="mt-2 text-2xl font-extrabold">{plan.price}</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.products}</p>
                {plan.highlight && (
                  <a href="/api/login" className="block mt-4">
                    <Button
                      className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-semibold"
                    >
                      Начать
                    </Button>
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Готовы начать продавать?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Создайте свою витрину за 5 минут и начните принимать заказы через WhatsApp
          </p>
          <div className="mt-8">
            <a href="/api/login">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-base font-semibold"
              >
                Создать магазин бесплатно
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          TakeSale &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
