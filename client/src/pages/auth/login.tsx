import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff, ArrowRight } from "lucide-react";
import { TappLogo } from "@/components/tapp-logo";
import { Link } from "wouter";

export default function LoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: (data: { isSuperAdmin?: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = data.isSuperAdmin ? "/superadmin" : "/";
    },
    onError: (e: Error) => {
      const msg = e.message.includes("401")
        ? "Неверный email или пароль"
        : e.message.includes("400")
        ? "Проверьте введённые данные"
        : "Ошибка входа";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3 dark:from-primary/5 dark:via-background dark:to-primary/3" />
      <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />
      <div className="absolute -bottom-20 -left-32 h-80 w-80 rounded-full bg-primary/8 blur-3xl dark:bg-primary/3" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/">
            <TappLogo size={56} className="mx-auto mb-4 rounded-2xl" />
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-login-title">Войти в Tapp</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Введите email и пароль для входа</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="mt-1.5"
                data-testid="input-login-email"
              />
            </div>
            <div>
              <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Пароль</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  autoComplete="current-password"
                  data-testid="input-login-password"
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
              className="w-full rounded-full font-semibold"
              disabled={!email || !password || loginMutation.isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? "Вход..." : (
                <>
                  <LogIn className="mr-1.5 h-4 w-4" /> Войти
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-xs text-muted-foreground" data-testid="link-forgot-password">
                Забыли пароль?
              </Link>
            </div>
          </form>
        </Card>

        <div className="mt-5 text-center text-sm">
          <span className="text-muted-foreground">Нет аккаунта? </span>
          <Link href="/register" className="font-semibold text-primary" data-testid="link-to-register">
            Зарегистрироваться <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
