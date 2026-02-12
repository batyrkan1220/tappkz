import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Store, ShoppingBag, MessageCircle, Smartphone, Palette, BarChart3 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

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
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <SiWhatsapp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">TakeSale</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login">Войти</Button>
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <SiWhatsapp className="h-3.5 w-3.5" />
              Для бизнеса в Казахстане
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Продавайте через{" "}
              <span className="text-primary">WhatsApp</span> — легко и быстро
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Создайте онлайн-витрину для вашего бизнеса. Клиенты выбирают товары, собирают корзину и оформляют заказ прямо в WhatsApp.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/api/login">
                <Button size="lg" data-testid="button-get-started">
                  Начать бесплатно
                </Button>
              </a>
              <a href="#features">
                <Button variant="outline" size="lg" data-testid="button-learn-more">
                  Узнать больше
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Бесплатно до 30 товаров
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Без онлайн-оплаты
              </span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative mx-auto w-72 overflow-hidden rounded-[2rem] border-[8px] border-foreground/10 bg-card shadow-xl">
              <div className="aspect-[9/16] p-4">
                <div className="mb-4 h-12 w-12 rounded-md bg-primary/20" />
                <div className="mb-2 h-4 w-32 rounded bg-foreground/10" />
                <div className="mb-6 h-3 w-48 rounded bg-foreground/5" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 rounded-md border p-2">
                      <div className="h-16 w-16 shrink-0 rounded-md bg-muted" />
                      <div className="flex-1 space-y-1.5 pt-1">
                        <div className="h-3 w-20 rounded bg-foreground/10" />
                        <div className="h-2.5 w-28 rounded bg-foreground/5" />
                        <div className="h-3 w-16 rounded bg-primary/20" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 rounded-md bg-green-600 py-2.5 text-sm font-medium text-white">
                  <SiWhatsapp className="h-4 w-4" />
                  Оформить заказ
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-card/50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
              Всё для вашего бизнеса
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Простой и мощный инструмент для продаж через мессенджер
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="hover-elevate p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
            Тарифы
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Начните бесплатно, расширяйтесь по мере роста
          </p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { name: "Free", price: "Бесплатно", products: "до 30 товаров" },
              { name: "Pro", price: "Скоро", products: "до 300 товаров" },
              { name: "Business", price: "Скоро", products: "до 2000 товаров" },
            ].map((plan) => (
              <Card key={plan.name} className="p-5 text-left">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="mt-1 text-2xl font-bold">{plan.price}</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.products}</p>
              </Card>
            ))}
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
