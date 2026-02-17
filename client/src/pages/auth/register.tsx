import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Eye, EyeOff, ArrowRight, CheckCircle2, Zap, ShoppingBag, BarChart3, MessageCircle, Clock, Shield } from "lucide-react";
import { TappLogo } from "@/components/tapp-logo";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { usePlatformPixels } from "@/hooks/use-platform-pixels";
import { Link } from "wouter";
import { InternationalPhoneInput } from "@/components/international-phone-input";

const features = [
  {
    icon: Zap,
    title: "Запуск за 5 минут",
    desc: "Создайте магазин без программирования и дизайнера",
  },
  {
    icon: MessageCircle,
    title: "Заказы через WhatsApp",
    desc: "Клиенты оформляют заказы прямо в мессенджере",
  },
  {
    icon: ShoppingBag,
    title: "Витрина товаров",
    desc: "Красивый каталог с категориями, фото и ценами",
  },
  {
    icon: BarChart3,
    title: "Аналитика продаж",
    desc: "Статистика заказов, клиентов и просмотров",
  },
  {
    icon: Clock,
    title: "Управление заказами",
    desc: "Отслеживайте статусы и историю заказов",
  },
  {
    icon: Shield,
    title: "Бесплатный старт",
    desc: "Начните продавать без вложений и рисков",
  },
];

export default function RegisterPage() {
  usePlatformPixels();
  useDocumentTitle("Регистрация");
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email,
        password,
        firstName: firstName || undefined,
        phone: phoneNumber || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: (e: Error) => {
      const msg = e.message.includes("уже зарегистрирован")
        ? "Этот email уже зарегистрирован"
        : e.message.includes("400")
        ? "Проверьте введённые данные (пароль мин. 6 символов)"
        : "Ошибка регистрации";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    registerMutation.mutate();
  };

  const passwordStrength = password.length >= 8 ? "strong" : password.length >= 6 ? "ok" : "weak";

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3 dark:from-primary/5 dark:via-background dark:to-primary/3" />
      <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />
      <div className="absolute -bottom-20 -left-32 h-80 w-80 rounded-full bg-primary/8 blur-3xl dark:bg-primary/3" />

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
          <div className="max-w-lg">
            <Link href="/">
              <TappLogo size={48} className="mb-6 rounded-xl" />
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight" data-testid="text-register-hero">
              Откройте свой онлайн-магазин уже сегодня
            </h1>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
              Tapp — платформа для бизнеса, которая позволяет принимать заказы через WhatsApp. Без программирования, без абонентской платы на старте.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className="flex gap-3" data-testid={`feature-${f.title}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-6">
              <div>
                <p className="text-2xl font-extrabold text-primary" data-testid="stat-stores">500+</p>
                <p className="text-xs text-muted-foreground">магазинов создано</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-extrabold text-primary" data-testid="stat-orders">10 000+</p>
                <p className="text-xs text-muted-foreground">заказов обработано</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-extrabold text-primary" data-testid="stat-cities">50+</p>
                <p className="text-xs text-muted-foreground">городов</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6 lg:hidden">
              <Link href="/">
                <TappLogo size={56} className="mx-auto mb-4 rounded-2xl" />
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-register-title">Создать аккаунт</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Зарегистрируйтесь и создайте свой магазин</p>
            </div>

            <div className="hidden lg:block text-center mb-6">
              <h2 className="text-xl font-extrabold tracking-tight" data-testid="text-register-title-desktop">Создать аккаунт</h2>
              <p className="mt-1 text-sm text-muted-foreground">Бесплатно и без обязательств</p>
            </div>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Ваше имя</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Как вас зовут?"
                    autoComplete="given-name"
                    className="mt-1.5"
                    data-testid="input-register-name"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">WhatsApp номер</Label>
                  <div className="mt-1.5">
                    <InternationalPhoneInput
                      value={phoneNumber}
                      onValueChange={setPhoneNumber}
                      data-testid="input-register-phone"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Клиенты будут отправлять заказы на этот номер</p>
                </div>
                <div>
                  <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="mt-1.5"
                    data-testid="input-register-email"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Пароль *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      data-testid="input-register-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "weak" ? "bg-red-400" : "bg-primary"}`} />
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "ok" || passwordStrength === "strong" ? "bg-primary" : "bg-muted"}`} />
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength === "strong" ? "bg-primary" : "bg-muted"}`} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {passwordStrength === "weak" ? "Слабый" : passwordStrength === "ok" ? "Нормальный" : "Надёжный"}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Повторите пароль *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ещё раз пароль"
                      required
                      autoComplete="new-password"
                      className={confirmPassword && !passwordsMatch ? "border-red-400 focus-visible:ring-red-400" : ""}
                      data-testid="input-register-confirm-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-[11px] text-red-500 mt-1" data-testid="text-password-mismatch">Пароли не совпадают</p>
                  )}
                  {confirmPassword && passwordsMatch && password.length >= 6 && (
                    <p className="text-[11px] text-green-600 mt-1" data-testid="text-password-match">Пароли совпадают</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full font-semibold"
                  disabled={!email || !password || password.length < 6 || !confirmPassword || !passwordsMatch || registerMutation.isPending}
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? "Создание..." : (
                    <>
                      <UserPlus className="mr-1.5 h-4 w-4" /> Создать аккаунт
                    </>
                  )}
                </Button>
              </form>
            </Card>

            <div className="mt-5 space-y-2.5 lg:hidden">
              {features.slice(0, 4).map((f) => (
                <div key={f.title} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>{f.title}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 text-center text-sm">
              <span className="text-muted-foreground">Уже есть аккаунт? </span>
              <Link href="/login" className="font-semibold text-primary" data-testid="link-to-login">
                Войти <ArrowRight className="inline h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
