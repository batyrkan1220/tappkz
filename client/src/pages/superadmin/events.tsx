import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Activity, Eye, ShoppingCart, CreditCard } from "lucide-react";
import { Link } from "wouter";

interface PlatformEvent {
  id: number;
  storeId: number;
  storeName: string;
  eventType: string;
  createdAt: string | null;
}

const eventConfig: Record<string, { label: string; color: string; icon: typeof Eye }> = {
  visit: { label: "Просмотр", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Eye },
  add_to_cart: { label: "Добавление в корзину", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: ShoppingCart },
  checkout_click: { label: "Оформление заказа", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CreditCard },
};

export default function SuperAdminEvents() {
  const [eventType, setEventType] = useState("all");
  const [limit, setLimit] = useState("100");

  const { data: events, isLoading } = useQuery<PlatformEvent[]>({
    queryKey: ["/api/superadmin/events", eventType, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventType !== "all") params.set("eventType", eventType);
      params.set("limit", limit);
      const res = await fetch(`/api/superadmin/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  const grouped: Record<string, PlatformEvent[]> = {};
  events?.forEach((ev) => {
    const date = ev.createdAt ? new Date(ev.createdAt).toLocaleDateString("ru-RU") : "Без даты";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(ev);
  });

  const visitCount = events?.filter((e) => e.eventType === "visit").length || 0;
  const cartCount = events?.filter((e) => e.eventType === "add_to_cart").length || 0;
  const checkoutCount = events?.filter((e) => e.eventType === "checkout_click").length || 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-superadmin-events-title">Активность</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Просмотры: {visitCount} · Корзины: {cartCount} · Оформления: {checkoutCount}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="w-44" data-testid="select-event-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все события</SelectItem>
            <SelectItem value="visit">Просмотры</SelectItem>
            <SelectItem value="add_to_cart">Корзина</SelectItem>
            <SelectItem value="checkout_click">Оформление</SelectItem>
          </SelectContent>
        </Select>
        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className="w-28" data-testid="select-event-limit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="500">500</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, dayEvents]) => (
          <div key={date}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{date}</h3>
            <div className="space-y-1">
              {dayEvents.map((ev) => {
                const cfg = eventConfig[ev.eventType] || { label: ev.eventType, color: "bg-zinc-100 text-zinc-700", icon: Activity };
                const EventIcon = cfg.icon;
                return (
                  <div key={ev.id} className="flex items-center gap-3 rounded-md border px-4 py-2.5" data-testid={`row-event-${ev.id}`}>
                    <EventIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Link href={`/superadmin/stores/${ev.storeId}`}>
                      <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer truncate">{ev.storeName}</span>
                    </Link>
                    <Badge variant="secondary" className={cfg.color}>{cfg.label}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {(!events || events.length === 0) && (
          <Card className="p-8 text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Нет событий</p>
          </Card>
        )}
      </div>
    </div>
  );
}
