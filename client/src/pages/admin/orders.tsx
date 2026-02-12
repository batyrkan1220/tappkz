import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, ChevronDown, ChevronUp } from "lucide-react";
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
  { key: "unpaid", label: "Неоплаченный" },
  { key: "confirming", label: "Подтверждение платежа" },
  { key: "paid", label: "Оплачено" },
];

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
  });
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/my-store/orders"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, string | null> }) => {
      await apiRequest("PATCH", `/api/my-store/orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/orders"] });
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
        <h1 className="text-xl font-bold" data-testid="text-orders-title">Заказы</h1>
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
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Примечание</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Дата</th>
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

                  return (
                    <tr
                      key={order.id}
                      className="border-b last:border-b-0 hover-elevate cursor-pointer"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      data-testid={`row-order-${order.id}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1">
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
                      <td className="p-3 whitespace-nowrap" data-testid={`text-total-${order.id}`}>
                        {formatPriceSimple(order.total)}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.status}
                          onValueChange={(val) => updateMutation.mutate({ id: order.id, data: { status: val } })}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs" data-testid={`select-status-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">В ожидании</SelectItem>
                            <SelectItem value="confirmed">Подтверждён</SelectItem>
                            <SelectItem value="completed">Выполнен</SelectItem>
                            <SelectItem value="cancelled">Отменён</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.paymentStatus}
                          onValueChange={(val) => updateMutation.mutate({ id: order.id, data: { paymentStatus: val } })}
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs" data-testid={`select-payment-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Неоплаченный</SelectItem>
                            <SelectItem value="confirming">Подтверждение</SelectItem>
                            <SelectItem value="partially_paid">Частично оплачен</SelectItem>
                            <SelectItem value="paid">Оплачено</SelectItem>
                            <SelectItem value="refunded">Возврат</SelectItem>
                            <SelectItem value="voided">Аннулирован</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.fulfillmentStatus}
                          onValueChange={(val) => updateMutation.mutate({ id: order.id, data: { fulfillmentStatus: val } })}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs" data-testid={`select-fulfillment-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unfulfilled">Не выполнено</SelectItem>
                            <SelectItem value="partially_fulfilled">Частично</SelectItem>
                            <SelectItem value="fulfilled">Выполнено</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-center" data-testid={`text-items-count-${order.id}`}>{totalItems}</td>
                      <td className="p-3">
                        <span className="text-xs text-muted-foreground truncate max-w-[150px] block" data-testid={`text-note-${order.id}`}>
                          {order.internalNote || "—"}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground" data-testid={`text-date-${order.id}`}>
                        {formatDate(order.createdAt)}
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
      </div>

      {expandedOrder && (
        <OrderDetailPanel
          order={orders.find((o) => o.id === expandedOrder)!}
          onClose={() => setExpandedOrder(null)}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
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
  onUpdate: (id: number, data: Record<string, string | null>) => void;
}) {
  const items = (order.items as OrderItem[]) || [];
  const [note, setNote] = useState(order.internalNote || "");

  return (
    <div className="border rounded-md p-4 space-y-4 bg-card" data-testid="panel-order-detail">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-lg" data-testid="text-detail-order-num">Заказ #{order.orderNumber}</h3>
        <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
      </div>

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
            onClick={() => onUpdate(order.id, { internalNote: note || null })}
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
    </div>
  );
}
