import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, UserPlus, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { InternationalPhoneInput, COUNTRIES } from "@/components/international-phone-input";

const benefits = [
  "Бесплатный магазин за 5 минут",
  "WhatsApp-чекаут для заказов",
  "Аналитика и база клиентов",
  "Обучающие советы в WhatsApp",
];

export default function RegisterPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("KZ");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const fullPhone = phoneNumber ? selectedCountry.dial.replace("+", "") + phoneNumber : "";

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email,
        password,
        firstName: firstName || undefined,
        phone: fullPhone || undefined,
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
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3 dark:from-primary/5 dark:via-background dark:to-primary/3" />
      <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />
      <div className="absolute -bottom-20 -left-32 h-80 w-80 rounded-full bg-primary/8 blur-3xl dark:bg-primary/3" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground">
              <ShoppingBag className="h-7 w-7 text-background" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-register-title">Создать аккаунт</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Зарегистрируйтесь и создайте свой магазин</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Ваше имя</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
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
                  countryCode={countryCode}
                  onValueChange={(digits, code) => {
                    setPhoneNumber(digits);
                    setCountryCode(code);
                  }}
                  data-testid="input-register-phone"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Для уведомлений о заказах и рассылок</p>
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

        <div className="mt-5 space-y-2.5">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>{b}</span>
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
  );
}
