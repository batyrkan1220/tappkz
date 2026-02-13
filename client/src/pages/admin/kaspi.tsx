import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ExternalLink } from "lucide-react";
import kaspiLogo from "@assets/Снимок_экрана_2026-02-12_в_16.13.46_1770896385316.png";
import type { Store, StoreSettings } from "@shared/schema";

export default function KaspiPage() {
  const { toast } = useToast();
  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: settings, isLoading } = useQuery<StoreSettings>({ queryKey: ["/api/my-store/settings"] });

  const [kaspiEnabled, setKaspiEnabled] = useState(false);
  const [kaspiPayUrl, setKaspiPayUrl] = useState("");
  const [kaspiRecipientName, setKaspiRecipientName] = useState("");

  useEffect(() => {
    if (settings) {
      setKaspiEnabled(settings.kaspiEnabled);
      setKaspiPayUrl(settings.kaspiPayUrl || "");
      setKaspiRecipientName(settings.kaspiRecipientName || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/my-store/kaspi", {
        kaspiEnabled,
        kaspiPayUrl: kaspiPayUrl || null,
        kaspiRecipientName: kaspiRecipientName || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/settings"] });
      toast({ title: "Настройки Kaspi сохранены" });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
          <CreditCard className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-kaspi-title">Kaspi оплата</h1>
          <p className="text-xs text-muted-foreground">Приём платежей через Kaspi</p>
        </div>
      </div>

      <Card className="space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={kaspiLogo} alt="Kaspi" className="h-10 w-10 rounded-lg object-contain" />
            <div>
              <p className="font-extrabold tracking-tight" data-testid="text-kaspi-label">Kaspi</p>
              <p className="text-xs text-muted-foreground">Оплата через Kaspi Pay</p>
            </div>
          </div>
          <Switch
            checked={kaspiEnabled}
            onCheckedChange={setKaspiEnabled}
            data-testid="switch-kaspi-enabled"
          />
        </div>

        {kaspiEnabled && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label className="mb-1 block font-semibold">
                Ссылка на платеж Kaspi <span className="text-destructive">*</span>
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Введите ссылку на платеж Kaspi - напр. https://pay.kaspi.kz/pay/xyzab40cd
              </p>
              <Input
                value={kaspiPayUrl}
                onChange={(e) => setKaspiPayUrl(e.target.value)}
                placeholder="https://pay.kaspi.kz/pay/..."
                data-testid="input-kaspi-pay-url"
              />
            </div>

            <div>
              <Label className="mb-1 block font-semibold">Имя получателя</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Имя получателя для отображения покупателю
              </p>
              <Input
                value={kaspiRecipientName}
                onChange={(e) => setKaspiRecipientName(e.target.value)}
                placeholder="Иван Иванов"
                data-testid="input-kaspi-recipient"
              />
            </div>

            <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/10 p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Как получить ссылку Kaspi?</p>
              <ol className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-400/80">
                <li>1. Откройте приложение Kaspi.kz</li>
                <li>2. Перейдите в раздел "Kaspi Pay"</li>
                <li>3. Нажмите "Создать ссылку на оплату"</li>
                <li>4. Скопируйте ссылку и вставьте сюда</li>
              </ol>
            </div>
          </div>
        )}

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || (kaspiEnabled && !kaspiPayUrl)}
          className="rounded-full font-semibold"
          data-testid="button-save-kaspi"
        >
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </Card>
    </div>
  );
}
