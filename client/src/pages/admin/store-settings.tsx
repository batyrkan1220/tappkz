import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PhoneInput } from "@/components/phone-input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Crown, CheckCircle2, XCircle, Loader2, BarChart3, Megaphone, LayoutGrid, List, Circle, Store as StoreIcon, Globe, ShoppingCart, Eye } from "lucide-react";
import { SiTelegram, SiInstagram } from "react-icons/si";
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
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState("");
  const [showSocialCards, setShowSocialCards] = useState(true);
  const [showCategoryChips, setShowCategoryChips] = useState(true);
  const [categoryDisplayStyle, setCategoryDisplayStyle] = useState("chips");
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
      setFacebookPixelId(settings.facebookPixelId || "");
      setTiktokPixelId(settings.tiktokPixelId || "");
      setAnnouncementText(settings.announcementText || "");
      setShowAnnouncement(settings.showAnnouncement ?? false);
      setTelegramUrl(settings.telegramUrl || "");
      setShowSocialCards(settings.showSocialCards ?? true);
      setShowCategoryChips(settings.showCategoryChips ?? true);
      setCategoryDisplayStyle(settings.categoryDisplayStyle || "chips");
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
        facebookPixelId: facebookPixelId || null,
        tiktokPixelId: tiktokPixelId || null,
        announcementText: announcementText || null,
        showAnnouncement,
        telegramUrl: telegramUrl || null,
        showSocialCards,
        showCategoryChips,
        categoryDisplayStyle,
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
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const canSave = name && slug && !saveMutation.isPending && !slugChecking && !(slugStatus !== null && !slugStatus.available);

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-settings-title">Настройки</h1>
            <p className="text-xs text-muted-foreground">Управление магазином</p>
          </div>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!canSave}
          className="rounded-full font-semibold"
          data-testid="button-save-settings"
        >
          {saveMutation.isPending ? "Сохранение..." : "Сохранить все"}
        </Button>
      </div>

      <Card className="p-5" data-testid="card-store-info">
        <div className="flex items-center gap-2 mb-4">
          <StoreIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-extrabold tracking-tight">Информация о магазине</h3>
        </div>
        <div className="space-y-4">
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
        </div>
      </Card>

      <Card className="p-5" data-testid="card-contacts">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-extrabold tracking-tight">Контакты и соц. сети</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="font-semibold flex items-center gap-1.5"><SiInstagram className="h-3.5 w-3.5" /> Instagram</Label>
            <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="@username или ссылка" data-testid="input-store-instagram" />
          </div>
          <div>
            <Label className="font-semibold flex items-center gap-1.5"><SiTelegram className="h-3.5 w-3.5" /> Telegram</Label>
            <Input value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/your_channel" data-testid="input-store-telegram" />
            <p className="mt-1 text-xs text-muted-foreground">Ссылка на канал или группу</p>
          </div>
          <div>
            <Label className="font-semibold">Телефон для связи</Label>
            <PhoneInput value={phoneNumber} onValueChange={setPhoneNumber} data-testid="input-store-phone" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              <p className="font-semibold">Показывать соц. сети на витрине</p>
              <p className="text-sm text-muted-foreground">WhatsApp, Telegram, Instagram</p>
            </div>
            <Switch checked={showSocialCards} onCheckedChange={setShowSocialCards} data-testid="switch-show-social-cards" />
          </div>
        </div>
      </Card>

      <Card className="p-5" data-testid="card-storefront-display">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-extrabold tracking-tight">Витрина</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Показывать цены</p>
              <p className="text-sm text-muted-foreground">Отключите, чтобы скрыть цены в магазине</p>
            </div>
            <Switch checked={showPrices} onCheckedChange={setShowPrices} data-testid="switch-show-prices" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Показывать категории</p>
              <p className="text-sm text-muted-foreground">Навигация по категориям на витрине</p>
            </div>
            <Switch checked={showCategoryChips} onCheckedChange={setShowCategoryChips} data-testid="switch-show-category-chips" />
          </div>
          {showCategoryChips && (
            <div className="pl-0">
              <p className="font-semibold mb-2">Стиль категорий</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "chips", label: "Чипсы", icon: Circle, preview: (
                    <div className="flex gap-1 mt-1.5">
                      <div className="h-2 w-6 rounded-full bg-primary/60" />
                      <div className="h-2 w-8 rounded-full bg-muted" />
                      <div className="h-2 w-5 rounded-full bg-muted" />
                    </div>
                  )},
                  { value: "grid", label: "Сетка", icon: LayoutGrid, preview: (
                    <div className="grid grid-cols-2 gap-1 mt-1.5">
                      <div className="h-4 rounded bg-muted" />
                      <div className="h-4 rounded bg-muted" />
                      <div className="h-4 rounded bg-muted" />
                      <div className="h-4 rounded bg-muted" />
                    </div>
                  )},
                  { value: "list", label: "Список", icon: List, preview: (
                    <div className="space-y-1 mt-1.5">
                      <div className="h-2 w-full rounded bg-muted" />
                      <div className="h-2 w-3/4 rounded bg-muted" />
                      <div className="h-2 w-full rounded bg-muted" />
                    </div>
                  )},
                ].map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    className={`rounded-lg border-2 p-3 text-left transition-all ${categoryDisplayStyle === style.value ? "border-primary bg-primary/5" : "border-border"}`}
                    onClick={() => setCategoryDisplayStyle(style.value)}
                    data-testid={`button-style-${style.value}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <style.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold">{style.label}</span>
                    </div>
                    {style.preview}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5" data-testid="card-announcement">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-extrabold tracking-tight">Объявление</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Показывать объявление</p>
              <p className="text-sm text-muted-foreground">Баннер вверху витрины</p>
            </div>
            <Switch checked={showAnnouncement} onCheckedChange={setShowAnnouncement} data-testid="switch-show-announcement" />
          </div>
          {showAnnouncement && (
            <div>
              <Label className="font-semibold">Текст объявления</Label>
              <Textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Например: Работаем с 10:00 до 22:00. Доставка бесплатная от 5000 ₸!"
                data-testid="input-announcement-text"
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5" data-testid="card-checkout">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-extrabold tracking-tight">Оформление заказа</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Поле «Адрес»</p>
              <p className="text-sm text-muted-foreground">Покупатель сможет указать адрес доставки</p>
            </div>
            <Switch checked={checkoutAddressEnabled} onCheckedChange={setCheckoutAddressEnabled} data-testid="switch-checkout-address" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Поле «Комментарий»</p>
              <p className="text-sm text-muted-foreground">Покупатель сможет оставить пожелания</p>
            </div>
            <Switch checked={checkoutCommentEnabled} onCheckedChange={setCheckoutCommentEnabled} data-testid="switch-checkout-comment" />
          </div>
        </div>
      </Card>

      <Card className="p-5" data-testid="card-pixels">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-extrabold tracking-tight">Пиксели аналитики</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Для отслеживания конверсий и ретаргетинга</p>
        <div className="space-y-3">
          <div>
            <Label className="font-semibold">Facebook Pixel ID</Label>
            <Input
              value={facebookPixelId}
              onChange={(e) => setFacebookPixelId(e.target.value.replace(/\D/g, ""))}
              placeholder="123456789012345"
              data-testid="input-facebook-pixel"
            />
          </div>
          <div>
            <Label className="font-semibold">TikTok Pixel ID</Label>
            <Input
              value={tiktokPixelId}
              onChange={(e) => setTiktokPixelId(e.target.value)}
              placeholder="ABCDEFG123456"
              data-testid="input-tiktok-pixel"
            />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-4 z-10">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!canSave}
          className="w-full rounded-full font-semibold shadow-lg"
          data-testid="button-save-settings-bottom"
        >
          {saveMutation.isPending ? "Сохранение..." : "Сохранить все настройки"}
        </Button>
      </div>

      <Card className="p-5" data-testid="card-plan-info">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold tracking-tight" data-testid="text-plan-name">Тариф: {store?.plan?.toUpperCase()}</h3>
              <p className="text-sm text-muted-foreground">Управление подпиской</p>
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
