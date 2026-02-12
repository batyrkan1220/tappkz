import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, UserPlus, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

export default function RegisterPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email,
        password,
        firstName: firstName || undefined,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 via-white to-emerald-50/60 dark:from-green-950/20 dark:via-background dark:to-emerald-950/10" />
      <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-green-100/40 blur-3xl dark:bg-green-900/10" />

      <Card className="relative z-10 w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          <Link href="/">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight" data-testid="text-register-title">Создать аккаунт</h1>
          <p className="mt-1 text-sm text-muted-foreground">Зарегистрируйтесь и создайте свой магазин</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-semibold">Имя</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ваше имя"
              autoComplete="given-name"
              data-testid="input-register-name"
            />
          </div>
          <div>
            <Label className="font-semibold">Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              data-testid="input-register-email"
            />
          </div>
          <div>
            <Label className="font-semibold">Пароль *</Label>
            <div className="relative">
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
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 text-white rounded-full font-semibold"
            disabled={!email || !password || password.length < 6 || registerMutation.isPending}
            data-testid="button-register-submit"
          >
            {registerMutation.isPending ? "Создание..." : (
              <>
                <UserPlus className="mr-1.5 h-4 w-4" /> Создать аккаунт
              </>
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Уже есть аккаунт? </span>
          <Link href="/login" className="font-semibold text-green-600 underline" data-testid="link-to-login">
            Войти
          </Link>
        </div>
      </Card>
    </div>
  );
}
