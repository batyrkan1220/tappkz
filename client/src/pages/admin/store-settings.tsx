import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Crown } from "lucide-react";
import type { Store, StoreSettings } from "@shared/schema";

export default function StoreSettingsPage() {
  const { toast } = useToast();
  const { data: store, isLoading: storeLoading } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: settings, isLoading: settingsLoading } = useQuery<StoreSettings>({ queryKey: ["/api/my-store/settings"] });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [showPrices, setShowPrices] = useState(true);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (store) {
      setName(store.name);
      setSlug(store.slug);
      setCity(store.city || "");
      setDescription(store.description || "");
    }
    if (settings) {
      setShowPrices(settings.showPrices);
      setInstagramUrl(settings.instagramUrl || "");
      setPhoneNumber(settings.phoneNumber || "");
    }
  }, [store, settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/my-store/settings", {
        name,
        slug,
        city: city || null,
        description: description || null,
        showPrices,
        instagramUrl: instagramUrl || null,
        phoneNumber: phoneNumber || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/settings"] });
      toast({ title: "Настройки сохранены" });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  if (storeLoading || settingsLoading) {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
          <Settings className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-settings-title">Настройки магазина</h1>
          <p className="text-xs text-muted-foreground">Основная информация и контакты</p>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <div>
          <Label className="font-semibold">Название магазина *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-store-name" />
        </div>
        <div>
          <Label className="font-semibold">URL (slug) *</Label>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{window.location.origin}/s/</span>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className="flex-1" data-testid="input-store-slug" />
          </div>
        </div>
        <div>
          <Label className="font-semibold">Город</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Алматы" data-testid="input-store-city" />
        </div>
        <div>
          <Label className="font-semibold">Описание</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Расскажите о вашем бизнесе" data-testid="input-store-description" />
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 font-extrabold tracking-tight">Контакты</h3>
          <div className="space-y-3">
            <div>
              <Label className="font-semibold">Instagram</Label>
              <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="@username" data-testid="input-store-instagram" />
            </div>
            <div>
              <Label className="font-semibold">Телефон для связи</Label>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+7 777 123 45 67" data-testid="input-store-phone" />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Показывать цены</p>
              <p className="text-sm text-muted-foreground">Отключите, чтобы скрыть цены на витрине</p>
            </div>
            <Switch checked={showPrices} onCheckedChange={setShowPrices} data-testid="switch-show-prices" />
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!name || !slug || saveMutation.isPending}
          className="bg-green-600 text-white rounded-full font-semibold"
          data-testid="button-save-settings"
        >
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </Card>

      <Card className="p-5" data-testid="card-plan-info">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold tracking-tight" data-testid="text-plan-name">Тариф: {store?.plan?.toUpperCase()}</h3>
              <Badge variant="secondary" className="rounded-full font-semibold">{store?.plan === "free" ? "Бесплатный" : store?.plan === "pro" ? "Профессиональный" : "Бизнес"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-plan-limit">
              {store?.plan === "free" ? "До 30 товаров" : store?.plan === "pro" ? "До 300 товаров" : "До 2000 товаров"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
