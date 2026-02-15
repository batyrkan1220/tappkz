import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Settings, Send, History, TestTube, Users, Store, CheckCircle, XCircle, Clock, AlertTriangle, GraduationCap, Plus, Trash2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Store as StoreType } from "@shared/schema";

interface WabaConfig {
  apiKey?: string;
  senderPhone?: string;
  orderNotificationTemplate?: string;
  broadcastTemplate?: string;
  enabled?: boolean;
}

interface WabaMessage {
  id: number;
  storeId: number | null;
  recipientPhone: string;
  messageType: string;
  templateName: string | null;
  content: string | null;
  status: string;
  wamid: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface MessageData {
  messages: WabaMessage[];
  stats: { total: number; sent: number; failed: number };
}

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  sent: CheckCircle,
  failed: XCircle,
  pending: Clock,
};

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

function SettingsTab() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<WabaConfig>({ queryKey: ["/api/superadmin/waba/config"] });

  const [apiKey, setApiKey] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (!initialized && config) {
    setApiKey(config.apiKey || "");
    setSenderPhone(config.senderPhone || "");
    setEnabled(config.enabled || false);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: WabaConfig) => {
      await apiRequest("PUT", "/api/superadmin/waba/config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/waba/config"] });
      toast({ title: "Настройки сохранены" });
    },
    onError: () => {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (data: { phone: string; message: string }) => {
      const res = await apiRequest("POST", "/api/superadmin/waba/test", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/waba/messages"] });
      if (data.status === "sent") {
        toast({ title: "Тестовое сообщение отправлено" });
      } else {
        toast({ title: "Ошибка отправки", description: data.errorMessage || "Проверьте API ключ", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Ошибка отправки", variant: "destructive" });
    },
  });

  const [testPhone, setTestPhone] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Подключение 360dialog</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Label className="text-sm font-semibold">Активировать WhatsApp API</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Включить отправку уведомлений и рассылок</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} data-testid="switch-waba-enabled" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">API ключ 360dialog</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Вставьте API ключ из панели 360dialog"
              data-testid="input-waba-api-key"
            />
            <p className="text-xs text-muted-foreground">Получите ключ на hub.360dialog.com</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Номер отправителя</Label>
            <Input
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="77001234567"
              data-testid="input-waba-sender-phone"
            />
            <p className="text-xs text-muted-foreground">Номер WhatsApp Business, подключённый к 360dialog</p>
          </div>

          <Button
            onClick={() => saveMutation.mutate({ apiKey, senderPhone, enabled })}
            disabled={saveMutation.isPending}
            data-testid="button-save-waba-config"
          >
            {saveMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <TestTube className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Тестовое сообщение</h3>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Номер получателя</Label>
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="77001234567"
              data-testid="input-test-phone"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => testMutation.mutate({ phone: testPhone, message: "TakeSale: Тестовое сообщение WhatsApp API" })}
            disabled={testMutation.isPending || !testPhone}
            data-testid="button-send-test"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {testMutation.isPending ? "Отправка..." : "Отправить тест"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold">Инструкция по подключению</h3>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Зарегистрируйтесь на <span className="font-semibold text-foreground">360dialog.com</span></li>
          <li>Подключите номер WhatsApp Business в панели 360dialog</li>
          <li>Скопируйте API ключ из раздела "API Keys"</li>
          <li>Вставьте ключ выше и включите интеграцию</li>
          <li>Отправьте тестовое сообщение для проверки</li>
        </ol>
      </Card>
    </div>
  );
}

function BroadcastTab() {
  const { toast } = useToast();
  const { data: stores } = useQuery<(StoreType & { productsCount?: number })[]>({ queryKey: ["/api/superadmin/stores"] });

  const [targetType, setTargetType] = useState<"all_customers" | "store_customers">("all_customers");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [lastResult, setLastResult] = useState<{ total: number; sent: number; failed: number } | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: async (data: { targetType: string; storeId?: number; message: string }) => {
      const res = await apiRequest("POST", "/api/superadmin/waba/broadcast", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/waba/messages"] });
      setLastResult({ total: data.total, sent: data.sent, failed: data.failed });
      if (data.sent > 0) {
        toast({ title: `Рассылка отправлена: ${data.sent} из ${data.total}` });
      } else if (data.total === 0) {
        toast({ title: "Нет получателей", description: "Не найдено клиентов с номерами телефонов", variant: "destructive" });
      } else {
        toast({ title: "Ошибка рассылки", description: `${data.failed} из ${data.total} не доставлены`, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Ошибка рассылки", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Send className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Новая рассылка</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Получатели</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as any)} data-testid="select-broadcast-target">
              <SelectTrigger data-testid="trigger-broadcast-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_customers">Все клиенты платформы</SelectItem>
                <SelectItem value="store_customers">Клиенты конкретного магазина</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === "store_customers" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Магазин</Label>
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId} data-testid="select-broadcast-store">
                <SelectTrigger data-testid="trigger-broadcast-store">
                  <SelectValue placeholder="Выберите магазин" />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Текст сообщения</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите текст рассылки..."
              className="min-h-[100px]"
              data-testid="textarea-broadcast-message"
            />
            <p className="text-xs text-muted-foreground">{message.length} / 4096 символов</p>
          </div>

          <Button
            onClick={() => {
              const payload: any = { targetType, message };
              if (targetType === "store_customers" && selectedStoreId) {
                payload.storeId = parseInt(selectedStoreId);
              }
              broadcastMutation.mutate(payload);
            }}
            disabled={broadcastMutation.isPending || !message.trim() || (targetType === "store_customers" && !selectedStoreId)}
            data-testid="button-send-broadcast"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {broadcastMutation.isPending ? "Отправка..." : "Отправить рассылку"}
          </Button>
        </div>
      </Card>

      {lastResult && (
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3">Результат рассылки</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">Всего</p>
              <p className="text-lg font-bold" data-testid="text-broadcast-total">{lastResult.total}</p>
            </div>
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">Отправлено</p>
              <p className="text-lg font-bold text-green-600" data-testid="text-broadcast-sent">{lastResult.sent}</p>
            </div>
            <div className="rounded-md border px-3 py-2">
              <p className="text-xs text-muted-foreground">Ошибки</p>
              <p className="text-lg font-bold text-red-600" data-testid="text-broadcast-failed">{lastResult.failed}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function HistoryTab() {
  const { data, isLoading } = useQuery<MessageData>({ queryKey: ["/api/superadmin/waba/messages"] });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  const messages = data?.messages || [];
  const stats = data?.stats || { total: 0, sent: 0, failed: 0 };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-0.5">Всего сообщений</p>
          <p className="text-2xl font-extrabold" data-testid="text-stats-total">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-0.5">Отправлено</p>
          <p className="text-2xl font-extrabold text-green-600" data-testid="text-stats-sent">{stats.sent}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-0.5">Ошибки</p>
          <p className="text-2xl font-extrabold text-red-600" data-testid="text-stats-failed">{stats.failed}</p>
        </Card>
      </div>

      {messages.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Нет сообщений</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const StatusIcon = STATUS_ICONS[msg.status] || Clock;
            return (
              <Card key={msg.id} className="p-3" data-testid={`card-message-${msg.id}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <StatusIcon className={`h-4 w-4 ${msg.status === "sent" ? "text-green-600" : msg.status === "failed" ? "text-red-600" : "text-amber-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">{msg.recipientPhone}</span>
                      <Badge className={`rounded-full text-[10px] no-default-hover-elevate no-default-active-elevate ${STATUS_COLORS[msg.status] || ""}`}>
                        {msg.status === "sent" ? "Отправлено" : msg.status === "failed" ? "Ошибка" : "В очереди"}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full text-[10px] no-default-hover-elevate no-default-active-elevate">
                        {msg.messageType === "order_notification" ? "Заказ" : msg.messageType === "template" ? "Шаблон" : "Текст"}
                      </Badge>
                    </div>
                    {msg.content && (
                      <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                    )}
                    {msg.errorMessage && (
                      <p className="text-xs text-red-600 mt-0.5 truncate">{msg.errorMessage}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(msg.createdAt).toLocaleString("ru-RU", { timeZone: "Asia/Almaty", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface OnboardingConfig {
  welcomeEnabled: boolean;
  welcomeMessage: string;
  storeCreatedEnabled: boolean;
  storeCreatedMessage: string;
  tipsEnabled: boolean;
  tipsMessages: string[];
  tipsDelayMinutes: number;
}

function OnboardingTab() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<OnboardingConfig>({ queryKey: ["/api/superadmin/waba/onboarding"] });

  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [storeCreatedEnabled, setStoreCreatedEnabled] = useState(true);
  const [storeCreatedMessage, setStoreCreatedMessage] = useState("");
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [tipsMessages, setTipsMessages] = useState<string[]>([]);
  const [tipsDelayMinutes, setTipsDelayMinutes] = useState(60);
  const [initialized, setInitialized] = useState(false);

  if (!initialized && config) {
    setWelcomeEnabled(config.welcomeEnabled);
    setWelcomeMessage(config.welcomeMessage);
    setStoreCreatedEnabled(config.storeCreatedEnabled);
    setStoreCreatedMessage(config.storeCreatedMessage);
    setTipsEnabled(config.tipsEnabled);
    setTipsMessages(config.tipsMessages || []);
    setTipsDelayMinutes(config.tipsDelayMinutes || 60);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingConfig>) => {
      await apiRequest("PUT", "/api/superadmin/waba/onboarding", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/waba/onboarding"] });
      toast({ title: "Настройки онбординга сохранены" });
    },
    onError: () => {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      welcomeEnabled,
      welcomeMessage,
      storeCreatedEnabled,
      storeCreatedMessage,
      tipsEnabled,
      tipsMessages,
      tipsDelayMinutes,
    });
  };

  const updateTip = (index: number, value: string) => {
    const updated = [...tipsMessages];
    updated[index] = value;
    setTipsMessages(updated);
  };

  const removeTip = (index: number) => {
    setTipsMessages(tipsMessages.filter((_, i) => i !== index));
  };

  const addTip = () => {
    if (tipsMessages.length < 10) {
      setTipsMessages([...tipsMessages, ""]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Приветственное сообщение</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Отправляется при регистрации, если пользователь указал WhatsApp номер</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Label className="text-sm font-semibold">Отправлять приветствие</Label>
            <Switch checked={welcomeEnabled} onCheckedChange={setWelcomeEnabled} data-testid="switch-welcome-enabled" />
          </div>

          {welcomeEnabled && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Текст приветствия</Label>
              <Textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="min-h-[120px] text-sm"
                data-testid="textarea-welcome-message"
              />
              <p className="text-[11px] text-muted-foreground">Переменная: {"{name}"} — имя пользователя</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Store className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Создание магазина</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Отправляется когда пользователь создал магазин</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Label className="text-sm font-semibold">Отправлять уведомление</Label>
            <Switch checked={storeCreatedEnabled} onCheckedChange={setStoreCreatedEnabled} data-testid="switch-store-created-enabled" />
          </div>

          {storeCreatedEnabled && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Текст сообщения</Label>
              <Textarea
                value={storeCreatedMessage}
                onChange={(e) => setStoreCreatedMessage(e.target.value)}
                className="min-h-[120px] text-sm"
                data-testid="textarea-store-created-message"
              />
              <p className="text-[11px] text-muted-foreground">Переменные: {"{store_name}"} — название, {"{slug}"} — URL магазина</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold">Обучающие советы</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Серия советов, отправляемых после регистрации с интервалом</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Label className="text-sm font-semibold">Отправлять советы</Label>
            <Switch checked={tipsEnabled} onCheckedChange={setTipsEnabled} data-testid="switch-tips-enabled" />
          </div>

          {tipsEnabled && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Интервал между советами (минуты)</Label>
                <Input
                  type="number"
                  value={tipsDelayMinutes}
                  onChange={(e) => setTipsDelayMinutes(parseInt(e.target.value) || 60)}
                  min={1}
                  max={10080}
                  data-testid="input-tips-delay"
                />
                <p className="text-[11px] text-muted-foreground">Рекомендуем 60 минут (1 час) между сообщениями</p>
              </div>

              <div className="space-y-3">
                {tipsMessages.map((tip, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Label className="text-xs font-semibold">Совет #{i + 1}</Label>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeTip(i)}
                        data-testid={`button-remove-tip-${i}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    <Textarea
                      value={tip}
                      onChange={(e) => updateTip(i, e.target.value)}
                      className="min-h-[80px] text-sm"
                      data-testid={`textarea-tip-${i}`}
                    />
                  </div>
                ))}

                {tipsMessages.length < 10 && (
                  <Button variant="outline" onClick={addTip} data-testid="button-add-tip">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Добавить совет
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        data-testid="button-save-onboarding"
      >
        {saveMutation.isPending ? "Сохранение..." : "Сохранить настройки онбординга"}
      </Button>
    </div>
  );
}

export default function SuperAdminWhatsApp() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/30">
          <SiWhatsapp className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-whatsapp-title">WhatsApp API</h1>
          <p className="text-xs text-muted-foreground">360dialog WABA — уведомления и рассылки</p>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList data-testid="tabs-whatsapp">
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Настройки
          </TabsTrigger>
          <TabsTrigger value="onboarding" data-testid="tab-onboarding">
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            Онбординг
          </TabsTrigger>
          <TabsTrigger value="broadcast" data-testid="tab-broadcast">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Рассылка
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="mr-1.5 h-3.5 w-3.5" />
            История
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="onboarding" className="mt-4">
          <OnboardingTab />
        </TabsContent>
        <TabsContent value="broadcast" className="mt-4">
          <BroadcastTab />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
