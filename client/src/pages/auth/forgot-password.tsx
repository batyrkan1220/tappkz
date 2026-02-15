import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck, Mail } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Step = "email" | "code" | "password";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!isValidEmail) {
      toast({ title: "Введите корректный email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      const data = await res.json();
      setMaskedEmail(data.email);
      setStep("code");
      startCooldown();
      toast({ title: "Код отправлен на email" });
    } catch (e: any) {
      const msg = e.message.includes("429")
        ? "Слишком много попыток. Подождите 15 минут."
        : "Ошибка отправки кода";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast({ title: "Введите 6-значный код", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-code", { email, code });
      const data = await res.json();
      setResetToken(data.resetToken);
      setStep("password");
      toast({ title: "Код подтверждён" });
    } catch (e: any) {
      toast({ title: "Неверный или просроченный код", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Минимум 6 символов", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { resetToken, password });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Пароль успешно изменён" });
      window.location.href = "/";
    } catch (e: any) {
      toast({ title: "Ошибка сброса пароля. Попробуйте заново.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      startCooldown();
      toast({ title: "Код отправлен повторно" });
    } catch {
      toast({ title: "Ошибка повторной отправки", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword;
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
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-forgot-title">
            {step === "email" && "Восстановление пароля"}
            {step === "code" && "Введите код"}
            {step === "password" && "Новый пароль"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {step === "email" && "Введите email, указанный при регистрации"}
            {step === "code" && `Код отправлен на ${maskedEmail}`}
            {step === "password" && "Придумайте новый пароль"}
          </p>
        </div>

        <Card className="p-6">
          {step === "email" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="mt-1.5"
                  data-testid="input-forgot-email"
                />
                <p className="text-[11px] text-muted-foreground mt-1">На этот адрес придёт код восстановления</p>
              </div>
              <Button
                className="w-full rounded-full font-semibold"
                disabled={!isValidEmail || loading}
                onClick={handleSendCode}
                data-testid="button-send-code"
              >
                {loading ? "Отправка..." : "Отправить код"}
              </Button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Код из письма</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="mt-1.5 text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                  data-testid="input-verify-code"
                />
              </div>
              <Button
                className="w-full rounded-full font-semibold"
                disabled={code.length !== 6 || loading}
                onClick={handleVerifyCode}
                data-testid="button-verify-code"
              >
                {loading ? "Проверка..." : "Подтвердить"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-xs text-muted-foreground disabled:opacity-40"
                  disabled={cooldown > 0 || loading}
                  onClick={handleResendCode}
                  data-testid="button-resend-code"
                >
                  {cooldown > 0 ? `Отправить повторно через ${cooldown}с` : "Отправить код повторно"}
                </button>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground mx-auto"
                onClick={() => { setStep("email"); setCode(""); }}
                data-testid="button-back-to-email"
              >
                <ArrowLeft className="h-3 w-3" /> Изменить email
              </button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Label className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Новый пароль *</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    autoComplete="new-password"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
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
                    autoComplete="new-password"
                    className={confirmPassword && !passwordsMatch ? "border-red-400 focus-visible:ring-red-400" : ""}
                    data-testid="input-confirm-new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-red-500 mt-1">Пароли не совпадают</p>
                )}
                {confirmPassword && passwordsMatch && password.length >= 6 && (
                  <p className="text-[11px] text-green-600 mt-1">Пароли совпадают</p>
                )}
              </div>
              <Button
                className="w-full rounded-full font-semibold"
                disabled={!password || password.length < 6 || !passwordsMatch || loading}
                onClick={handleResetPassword}
                data-testid="button-save-password"
              >
                {loading ? "Сохранение..." : "Сохранить новый пароль"}
              </Button>
            </div>
          )}
        </Card>

        <div className="mt-5 text-center text-sm">
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-primary" data-testid="link-back-to-login">
            <ArrowLeft className="h-3.5 w-3.5" /> Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  );
}
