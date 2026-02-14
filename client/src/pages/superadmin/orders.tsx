import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Search, ExternalLink, Store } from "lucide-react";
import { Link } from "wouter";

interface PlatformOrder {
  id: number;
  storeId: number;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  items: any[];
  subtotal: number;
  total: number;
  paymentMethod: string | null;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string | null;
  storeName: string;
  storeSlug: string;
}

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  completed: "Выполнен",
  cancelled: "Отменён",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const paymentLabels: Record<string, string> = {
  unpaid: "Не оплачен",
  confirming: "Проверка",
  partially_paid: "Частично",
  paid: "Оплачен",
  refunded: "Возврат",
  voided: "Аннулирован",
};

const paymentColors: Record<string, string> = {
  unpaid: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  confirming: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  refunded: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const fulfillmentLabels: Record<string, string> = {
  unfulfilled: "Не выполнен",
  fulfilled: "Выполнен",
  partially_fulfilled: "Частично",
};

export default function SuperAdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (paymentFilter !== "all") queryParams.set("paymentStatus", paymentFilter);

  const { data: orders, isLoading } = useQuery<PlatformOrder[]>({
    queryKey: ["/api/superadmin/orders", search, statusFilter, paymentFilter],
    queryFn: async () => {
      const res = await fetch(`/api/superadmin/orders?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-superadmin-orders-title">Заказы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Всего: {orders?.length || 0} · Выручка: {totalRevenue.toLocaleString("ru-RU")} ₸
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, телефону, номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-orders-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" data-testid="select-orders-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="confirmed">Подтверждён</SelectItem>
            <SelectItem value="completed">Выполнен</SelectItem>
            <SelectItem value="cancelled">Отменён</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-36" data-testid="select-orders-payment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все оплаты</SelectItem>
            <SelectItem value="unpaid">Не оплачен</SelectItem>
            <SelectItem value="paid">Оплачен</SelectItem>
            <SelectItem value="confirming">Проверка</SelectItem>
            <SelectItem value="refunded">Возврат</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {orders?.map((order) => (
          <Card key={order.id} className="p-4" data-testid={`card-order-${order.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold" data-testid={`text-order-number-${order.id}`}>#{order.orderNumber}</span>
                  <Badge variant="secondary" className={statusColors[order.status] || ""}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  <Badge variant="secondary" className={paymentColors[order.paymentStatus] || ""}>
                    {paymentLabels[order.paymentStatus] || order.paymentStatus}
                  </Badge>
                  <Badge variant="secondary">
                    {fulfillmentLabels[order.fulfillmentStatus] || order.fulfillmentStatus}
                  </Badge>
                </div>
                <p className="mt-1 text-sm">{order.customerName} · {order.customerPhone}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Link href={`/superadmin/stores/${order.storeId}`}>
                    <span className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer" data-testid={`link-order-store-${order.id}`}>
                      <Store className="h-3 w-3" />
                      {order.storeName}
                    </span>
                  </Link>
                  {order.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" })}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold" data-testid={`text-order-total-${order.id}`}>{order.total.toLocaleString("ru-RU")} ₸</p>
                <p className="text-xs text-muted-foreground">{(order.items as any[])?.length || 0} позиций</p>
              </div>
            </div>
          </Card>
        ))}
        {(!orders || orders.length === 0) && (
          <Card className="p-8 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Заказы не найдены</p>
          </Card>
        )}
      </div>
    </div>
  );
}
