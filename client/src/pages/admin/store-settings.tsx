import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PhoneInput } from "@/components/phone-input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Crown, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Store, StoreSettings } from "@shared/schema";

export default function StoreSettingsPage() {
  useDocumentTitle("Настройки");
  const { toast } = useToast();
  const { data: store, isLoading: storeLoading } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: settings, isLoading: settingsLoading } = useQuery<StoreSettings>({ queryKey: ["/api/my-store/settings"] });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [showPrices, setShowPrices] = useState(true);
  const [checkoutAddressEnabled, setCheckoutAddressEnabled] = useState(false);
  const [checkoutCommentEnabled, setCheckoutCommentEnabled] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; reason: string | null } | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalSlugRef = useRef("");

  const checkSlug = (value: string) => {
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (!value || value.length < 2 || value === originalSlugRef.current) {
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

  useEffect(() => {
    if (store) {
      setName(store.name);
      setSlug(store.slug);
      originalSlugRef.current = store.slug;
      setCity(store.city || "");
      setDescription(store.description || "");
    }
    if (settings) {
      setShowPrices(settings.showPrices);
      setCheckoutAddressEnabled(settings.checkoutAddressEnabled ?? false);
      setCheckoutCommentEnabled(settings.checkoutCommentEnabled ?? false);
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
        checkoutAddressEnabled,
        checkoutCommentEnabled,
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
          <Label className="font-semibold">Адрес магазина *</Label>
          <Input value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="my-shop" data-testid="input-store-slug" />
          {slug && (
            <p className="mt-1 text-xs text-muted-foreground break-all">{window.location.origin}/{slug}</p>
          )}
          {slug.length >= 2 && slug !== originalSlugRef.current && (
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {slugChecking ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Проверяем...</span></>
              ) : slugStatus?.available ? (
                <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600">Адрес свободен</span></>
              ) : slugStatus && !slugStatus.available ? (
                <><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-red-500">{slugStatus.reason}</span></>
              ) : null}
            </div>
          )}
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
              <PhoneInput value={phoneNumber} onValueChange={setPhoneNumber} data-testid="input-store-phone" />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Показывать цены</p>
              <p className="text-sm text-muted-foreground">Отключите, чтобы скрыть цены в магазине</p>
            </div>
            <Switch checked={showPrices} onCheckedChange={setShowPrices} data-testid="switch-show-prices" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Поле "Адрес" при оформлении</p>
              <p className="text-sm text-muted-foreground">Покупатель сможет указать адрес доставки</p>
            </div>
            <Switch checked={checkoutAddressEnabled} onCheckedChange={setCheckoutAddressEnabled} data-testid="switch-checkout-address" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Поле "Комментарий" при оформлении</p>
              <p className="text-sm text-muted-foreground">Покупатель сможет оставить пожелания к заказу</p>
            </div>
            <Switch checked={checkoutCommentEnabled} onCheckedChange={setCheckoutCommentEnabled} data-testid="switch-checkout-comment" />
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!name || !slug || saveMutation.isPending || slugChecking || (slugStatus !== null && !slugStatus.available)}
          className="rounded-full font-semibold"
          data-testid="button-save-settings"
        >
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </Card>

      <Card className="p-5" data-testid="card-plan-info">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold tracking-tight" data-testid="text-plan-name">Тариф: {store?.plan?.toUpperCase()}</h3>
              <p className="text-sm text-muted-foreground">Управление подпиской и сравнение планов</p>
            </div>
          </div>
          <Link href="/admin/subscription">
            <Button variant="outline" className="rounded-full font-semibold" data-testid="button-go-subscription">
              Подробнее
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
