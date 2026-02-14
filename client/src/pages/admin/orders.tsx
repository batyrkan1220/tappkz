import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, ChevronDown, ChevronUp, Bell, BellOff, Volume2, AlertCircle, ExternalLink } from "lucide-react";
import type { Order } from "@shared/schema";

type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string | null;
};

const PAYMENT_FILTER_TABS = [
  { key: "all", label: "Все" },
  { key: "unpaid", label: "Неоплачен" },
  { key: "confirming", label: "Подтверждение" },
  { key: "paid", label: "Оплачено" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "В ожидании", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  confirmed: { label: "Подтверждён", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Выполнен", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Отменён", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  unpaid: { label: "Неоплачен", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  confirming: { label: "Подтверждение", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  partially_paid: { label: "Частично", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  paid: { label: "Оплачено", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  refunded: { label: "Возврат", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  voided: { label: "Аннулирован", className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300" },
};

const FULFILLMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  unfulfilled: { label: "Не выполнено", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  partially_fulfilled: { label: "Частично", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  fulfilled: { label: "Выполнено", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

function formatPriceSimple(amount: number) {
  return new Intl.NumberFormat("ru-KZ").format(amount) + " ₸";
}

function formatDate(date: string | Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  });
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playTone(880, now, 0.15);
    playTone(1100, now + 0.15, 0.15);
    playTone(1320, now + 0.3, 0.25);
  } catch (e) {
    // silently fail
  }
}

function StatusBadge({ value, config }: { value: string; config: Record<string, { label: string; className: string }> }) {
  const cfg = config[value] || { label: value, className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300" };
  return (
    <Badge variant="secondary" className={`rounded-full text-xs font-semibold no-default-hover-elevate no-default-active-elevate ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

function needsAction(order: Order): boolean {
  return order.status === "pending" || order.paymentStatus === "unpaid" || order.fulfillmentStatus === "unfulfilled";
}

function needsStatusAction(order: Order): boolean {
  return order.status === "pending";
}
function needsPaymentAction(order: Order): boolean {
  return order.paymentStatus === "unpaid";
}
function needsFulfillmentAction(order: Order): boolean {
  return order.fulfillmentStatus === "unfulfilled";
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("takesale_order_sound");
    return saved !== "false";
  });
  const prevOrderIdsRef = useRef<Set<number> | null>(null);
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/my-store/orders"],
    refetchInterval: 15000,
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("takesale_order_sound", String(next));
      if (next) {
        playNotificationSound();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!orders.length) {
      prevOrderIdsRef.current = new Set(orders.map((o) => o.id));
      return;
    }

    const currentIds = new Set(orders.map((o) => o.id));
    const prevIds = prevOrderIdsRef.current;

    if (prevIds !== null) {
      const newOrders = orders.filter((o) => !prevIds.has(o.id));
      if (newOrders.length > 0) {
        if (soundEnabled) {
          playNotificationSound();
        }
        for (const o of newOrders) {
          toast({
            title: `Новый заказ #${o.orderNumber}`,
            description: `${o.customerName} — ${formatPriceSimple(o.total)}`,
          });
        }
      }
    }

    prevOrderIdsRef.current = currentIds;
  }, [orders, soundEnabled, toast]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, label }: { id: number; data: Record<string, string | null>; label?: string }) => {
      await apiRequest("PATCH", `/api/my-store/orders/${id}`, data);
      return label;
    },
    onSuccess: (label) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/orders"] });
      toast({ title: label || "Заказ обновлён" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить заказ", variant: "destructive" });
    },
  });

  const filteredOrders = orders.filter((order) => {
    if (paymentFilter !== "all" && order.paymentStatus !== paymentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const items = (order.items as OrderItem[]) || [];
      const itemNames = items.map((i) => i.name.toLowerCase()).join(" ");
      return (
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        `#${order.orderNumber}`.includes(q) ||
        itemNames.includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => needsAction(o)).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold" data-testid="text-orders-title">Заказы</h1>
          {pendingCount > 0 && (
            <Badge className="rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate no-default-active-elevate" data-testid="badge-pending-count">
              <AlertCircle className="h-3 w-3 mr-1" />
              {pendingCount} требуют действия
            </Badge>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleSound}
          data-testid="button-toggle-sound"
          title={soundEnabled ? "Выключить звук уведомлений" : "Включить звук уведомлений"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по клиенту, продукту, номеру заказа или телефону"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-orders-search"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {PAYMENT_FILTER_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={paymentFilter === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setPaymentFilter(tab.key)}
            data-testid={`button-filter-${tab.key}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Заказ</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Клиент</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Всего</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Статус</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Оплата</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Выполнение</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Товары</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Дата</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    {orders.length === 0 ? "Заказов пока нет" : "Ничего не найдено"}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const items = (order.items as OrderItem[]) || [];
                  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
                  const isExpanded = expandedOrder === order.id;
                  const actionNeeded = needsAction(order);

                  return (
                    <tr
                      key={order.id}
                      className={`border-b last:border-b-0 hover-elevate cursor-pointer ${actionNeeded ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      data-testid={`row-order-${order.id}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {actionNeeded && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />}
                          <span className="font-semibold text-primary" data-testid={`text-order-num-${order.id}`}>#{order.orderNumber}</span>
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[150px]" data-testid={`text-client-${order.id}`}>{order.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{order.customerPhone}</p>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap font-semibold" data-testid={`text-total-${order.id}`}>
                        {formatPriceSimple(order.total)}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.status}
                          onValueChange={(val) => {
                            updateMutation.mutate({ id: order.id, data: { status: val }, label: `Статус заказа #${order.orderNumber}: ${STATUS_CONFIG[val]?.label || val}` });
                          }}
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs border-0 p-0 shadow-none focus:ring-0" data-testid={`select-status-${order.id}`}>
                            <StatusBadge value={order.status} config={STATUS_CONFIG} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${cfg.className.split(" ")[0]}`} />
                                  {cfg.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.paymentStatus}
                          onValueChange={(val) => {
                            updateMutation.mutate({ id: order.id, data: { paymentStatus: val }, label: `Оплата заказа #${order.orderNumber}: ${PAYMENT_STATUS_CONFIG[val]?.label || val}` });
                          }}
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs border-0 p-0 shadow-none focus:ring-0" data-testid={`select-payment-${order.id}`}>
                            <StatusBadge value={order.paymentStatus} config={PAYMENT_STATUS_CONFIG} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${cfg.className.split(" ")[0]}`} />
                                  {cfg.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.fulfillmentStatus}
                          onValueChange={(val) => {
                            updateMutation.mutate({ id: order.id, data: { fulfillmentStatus: val }, label: `Выполнение заказа #${order.orderNumber}: ${FULFILLMENT_STATUS_CONFIG[val]?.label || val}` });
                          }}
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs border-0 p-0 shadow-none focus:ring-0" data-testid={`select-fulfillment-${order.id}`}>
                            <StatusBadge value={order.fulfillmentStatus} config={FULFILLMENT_STATUS_CONFIG} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(FULFILLMENT_STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${cfg.className.split(" ")[0]}`} />
                                  {cfg.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-center" data-testid={`text-items-count-${order.id}`}>{totalItems}</td>
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground" data-testid={`text-date-${order.id}`}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <a href={`/invoice/${order.id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" data-testid={`button-invoice-${order.id}`} title="Посмотреть чек">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground">
        <span data-testid="text-orders-count">Всего {filteredOrders.length}</span>
        {soundEnabled && (
          <span className="flex items-center gap-1 text-xs">
            <Bell className="h-3 w-3" />
            Звуковые уведомления включены
          </span>
        )}
      </div>

      {expandedOrder && (
        <OrderDetailPanel
          order={orders.find((o) => o.id === expandedOrder)!}
          onClose={() => setExpandedOrder(null)}
          onUpdate={(id, data, label) => updateMutation.mutate({ id, data, label })}
        />
      )}
    </div>
  );
}

function OrderDetailPanel({
  order,
  onClose,
  onUpdate,
}: {
  order: Order;
  onClose: () => void;
  onUpdate: (id: number, data: Record<string, string | null>, label?: string) => void;
}) {
  const items = (order.items as OrderItem[]) || [];
  const [note, setNote] = useState(order.internalNote || "");
  const actionNeeded = needsAction(order);

  return (
    <Card className="p-4 space-y-4" data-testid="panel-order-detail">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-lg" data-testid="text-detail-order-num">Заказ #{order.orderNumber}</h3>
          {actionNeeded && (
            <Badge className="rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate no-default-active-elevate" data-testid="badge-action-needed">
              <AlertCircle className="h-3 w-3 mr-1" />
              Требует действия
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-md border p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Статус заказа</p>
          <Select
            value={order.status}
            onValueChange={(val) => {
              onUpdate(order.id, { status: val }, `Статус заказа #${order.orderNumber}: ${STATUS_CONFIG[val]?.label || val}`);
            }}
          >
            <SelectTrigger className="h-9" data-testid="select-detail-status">
              <StatusBadge value={order.status} config={STATUS_CONFIG} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.className.split(" ")[0]}`} />
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Оплата</p>
          <Select
            value={order.paymentStatus}
            onValueChange={(val) => {
              onUpdate(order.id, { paymentStatus: val }, `Оплата заказа #${order.orderNumber}: ${PAYMENT_STATUS_CONFIG[val]?.label || val}`);
            }}
          >
            <SelectTrigger className="h-9" data-testid="select-detail-payment">
              <StatusBadge value={order.paymentStatus} config={PAYMENT_STATUS_CONFIG} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.className.split(" ")[0]}`} />
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Выполнение</p>
          <Select
            value={order.fulfillmentStatus}
            onValueChange={(val) => {
              onUpdate(order.id, { fulfillmentStatus: val }, `Выполнение заказа #${order.orderNumber}: ${FULFILLMENT_STATUS_CONFIG[val]?.label || val}`);
            }}
          >
            <SelectTrigger className="h-9" data-testid="select-detail-fulfillment">
              <StatusBadge value={order.fulfillmentStatus} config={FULFILLMENT_STATUS_CONFIG} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FULFILLMENT_STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.className.split(" ")[0]}`} />
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {actionNeeded && (
        <div className="flex flex-wrap gap-2">
          {needsStatusAction(order) && (
            <Button
              size="sm"
              onClick={() => onUpdate(order.id, { status: "confirmed" }, `Заказ #${order.orderNumber} подтверждён`)}
              data-testid="button-confirm-order"
            >
              Подтвердить заказ
            </Button>
          )}
          {needsPaymentAction(order) && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 dark:text-green-400"
              onClick={() => onUpdate(order.id, { paymentStatus: "paid" }, `Оплата заказа #${order.orderNumber}: Оплачено`)}
              data-testid="button-mark-paid"
            >
              Отметить оплату
            </Button>
          )}
          {needsFulfillmentAction(order) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdate(order.id, { fulfillmentStatus: "fulfilled" }, `Выполнение заказа #${order.orderNumber}: Выполнено`)}
              data-testid="button-mark-fulfilled"
            >
              Отметить выполнение
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">Клиент</p>
          <p className="font-medium" data-testid="text-detail-client">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
          {order.customerAddress && <p className="text-sm text-muted-foreground">{order.customerAddress}</p>}
          {order.customerComment && <p className="text-sm italic text-muted-foreground">{order.customerComment}</p>}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">Оплата</p>
          <p className="text-sm">{order.paymentMethod || "WhatsApp"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">Товары</p>
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-sm py-1 border-b last:border-b-0">
              <div className="flex items-center gap-2 min-w-0">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                )}
                <span className="truncate">{item.quantity}x {item.name}</span>
              </div>
              <span className="shrink-0 font-medium">{formatPriceSimple(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold pt-2 border-t">
          <span>Итого</span>
          <span data-testid="text-detail-total">{formatPriceSimple(order.total)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">Внутреннее примечание</p>
        <div className="flex gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Заметка для себя..."
            className="flex-1"
            data-testid="input-internal-note"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate(order.id, { internalNote: note || null }, `Примечание к заказу #${order.orderNumber} сохранено`)}
            data-testid="button-save-note"
          >
            Сохранить
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" asChild data-testid="link-view-invoice">
          <a href={`/invoice/${order.id}`} target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4 mr-1" />
            Счёт
          </a>
        </Button>
      </div>
    </Card>
  );
}
