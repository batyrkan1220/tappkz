import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, CheckCircle2, XCircle, Loader2, ShoppingBag, Download } from "lucide-react";
import { TappLogo } from "@/components/tapp-logo";
import { PhoneInput } from "@/components/phone-input";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { BUSINESS_TYPES, type BusinessTypeKey } from "@shared/schema";

export default function CreateStorePage() {
  useDocumentTitle("Создание магазина");
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<BusinessTypeKey | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; reason: string | null } | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSlug = (value: string) => {
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (!value || value.length < 2) {
      setSlugStatus(null);
      setSlugChecking(false);
      return;
    }
    setSlugChecking(true);
    slugTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug/${value}`);
        const data = await res.json();
        setSlugStatus(data);
      } catch {
        setSlugStatus(null);
      } finally {
        setSlugChecking(false);
      }
    }, 400);
  };

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(clean);
    checkSlug(clean);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/stores", {
        name,
        slug,
        whatsappPhone,
        city: city || null,
        description: description || null,
        businessType: businessType || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store"] });
      toast({ title: "Магазин создан!" });
    },
    onError: (e: Error) => {
      if (e.message.includes("401")) {
        window.location.href = "/login";
        return;
      }
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === nameToSlug(name)) {
      const newSlug = nameToSlug(val);
      setSlug(newSlug);
      checkSlug(newSlug);
    }
  };

  const typeOptions: { key: BusinessTypeKey; icon: typeof ShoppingBag; desc: string }[] = [
    { key: "ecommerce", icon: ShoppingBag, desc: "Одежда, электроника, продукты и другие физические товары" },
    { key: "digital", icon: Download, desc: "Курсы, шаблоны, файлы и другие цифровые товары" },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3 dark:from-primary/5 dark:via-background dark:to-primary/3" />
      <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />

      <Card className="relative z-10 w-full max-w-lg space-y-5 p-6">
        <div className="text-center">
          <TappLogo size={56} className="mx-auto mb-3 rounded-2xl" />
          <h1 className="text-xl font-extrabold tracking-tight" data-testid="text-create-store-title">
            {step === 1 ? "Выберите тип магазина" : "Создайте ваш магазин"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-create-store-subtitle">
            {step === 1 ? "Это поможет настроить платформу под ваш бизнес" : "Заполните информацию для начала работы"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`} data-testid="step-indicator-1">1</div>
          <div className={`h-0.5 w-8 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`} data-testid="step-indicator-2">2</div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((t) => {
                const isSelected = businessType === t.key;
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setBusinessType(t.key)}
                    className={`flex flex-col items-center gap-3 rounded-md border-2 p-5 text-center transition-colors ${
                      isSelected ? "border-primary bg-primary/10 dark:bg-primary/5" : "border-border hover-elevate"
                    }`}
                    data-testid={`button-type-${t.key}`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                      <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{BUSINESS_TYPES[t.key].label}</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-tight">{t.desc}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full rounded-full font-semibold"
              onClick={() => setStep(2)}
              disabled={!businessType}
              data-testid="button-next-step"
            >
              Далее
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {businessType && (
              <div className="flex items-center gap-2 rounded-md bg-primary/10 dark:bg-primary/5 px-3 py-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{BUSINESS_TYPES[businessType].label}</span>
                <button onClick={() => setStep(1)} className="ml-auto text-xs text-muted-foreground underline" data-testid="button-change-type">Изменить</button>
              </div>
            )}

            <div>
              <Label className="font-semibold">Название *</Label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Мой магазин" data-testid="input-create-store-name" />
            </div>
            <div>
              <Label className="font-semibold">URL магазина *</Label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="shrink-0">tapp.kz/</span>
                <Input value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="my-store" data-testid="input-create-store-slug" />
              </div>
              {slug.length >= 2 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  {slugChecking ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Проверяем...</span></>
                  ) : slugStatus?.available ? (
                    <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600" data-testid="text-slug-available">Адрес свободен</span></>
                  ) : slugStatus && !slugStatus.available ? (
                    <><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-red-500" data-testid="text-slug-taken">{slugStatus.reason}</span></>
                  ) : null}
                </div>
              )}
            </div>
            <div>
              <Label className="font-semibold">Номер WhatsApp *</Label>
              <PhoneInput value={whatsappPhone} onValueChange={setWhatsappPhone} data-testid="input-create-store-phone" />
            </div>
            <div>
              <Label className="font-semibold">Город</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Алматы" data-testid="input-create-store-city" />
            </div>
            <div>
              <Label className="font-semibold">Описание</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Расскажите о вашем бизнесе" data-testid="input-create-store-desc" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full font-semibold" onClick={() => setStep(1)} data-testid="button-back-step">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Назад
              </Button>
              <Button
                className="flex-1 rounded-full font-semibold"
                onClick={() => createMutation.mutate()}
                disabled={!name || !slug || !whatsappPhone || whatsappPhone.replace(/\D/g, "").length < 11 || createMutation.isPending || slugChecking || (slugStatus !== null && !slugStatus.available)}
                data-testid="button-create-store"
              >
                {createMutation.isPending ? "Создание..." : "Создать магазин"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => {
      const map: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
      return map[c] || c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
