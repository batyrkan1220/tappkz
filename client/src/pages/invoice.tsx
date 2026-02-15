import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft, Copy, Check, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Order } from "@shared/schema";

interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string | null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-KZ").format(price) + " ₸";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  });
}

function formatKaspiPhone(phone: string) {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11 && clean.startsWith("8")) {
    return `+7 ${clean.slice(1, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 9)} ${clean.slice(9)}`;
  }
  if (clean.length === 11 && clean.startsWith("7")) {
    return `+7 ${clean.slice(1, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 9)} ${clean.slice(9)}`;
  }
  return phone;
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const { data, isLoading, error } = useQuery<{ order: Order; storeName: string; storeSlug: string; kaspiInfo: { phone: string; recipientName: string } | null }>({
    queryKey: ["/api/orders", params.id],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="mx-auto max-w-md space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="max-w-sm p-8 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-lg font-semibold">Заказ не найден</p>
          <p className="mt-1 text-sm text-muted-foreground">Проверьте ссылку и попробуйте снова</p>
        </Card>
      </div>
    );
  }

  const { order, storeName, storeSlug, kaspiInfo } = data;
  const items = order.items as OrderItem[];

  const statusLabel: Record<string, string> = {
    pending: "Ожидает",
    confirmed: "Подтверждён",
    completed: "Завершён",
    cancelled: "Отменён",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="mx-auto max-w-md">
        {storeSlug && (
          <a href={`/${storeSlug}`}>
            <Button variant="ghost" className="mb-3 gap-2" data-testid="button-back-to-store">
              <ArrowLeft className="h-4 w-4" />
              {storeName}
            </Button>
          </a>
        )}

        <Card className="overflow-hidden">
          <div className="border-b bg-white dark:bg-slate-900 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Заказ</p>
                <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-order-number">#{order.orderNumber}</h1>
              </div>
              <Badge
                className={`text-xs ${statusColor[order.status] || statusColor.pending}`}
                data-testid="badge-order-status"
              >
                {statusLabel[order.status] || order.status}
              </Badge>
            </div>
            {order.createdAt && (
              <p className="mt-1 text-xs text-muted-foreground" data-testid="text-order-date">{formatDate(order.createdAt as unknown as string)}</p>
            )}
            {storeName && (
              <p className="mt-0.5 text-xs text-muted-foreground">{storeName}</p>
            )}
          </div>

          <div className="divide-y">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4" data-testid={`invoice-item-${i}`}>
                {item.imageUrl && (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" data-testid={`text-item-name-${i}`}>
                    <span className="font-bold">{item.quantity}x</span> {item.name}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold" data-testid={`text-item-price-${i}`}>
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t bg-white dark:bg-slate-900 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Товары ({items.reduce((s, i) => s + i.quantity, 0)} шт.)</span>
              <span data-testid="text-subtotal">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Итого</span>
              <span data-testid="text-total">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="border-t p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Покупатель</p>
              <p className="text-sm font-semibold" data-testid="text-customer-name">{order.customerName}</p>
              <a href={`tel:${order.customerPhone}`} className="text-sm text-blue-600 dark:text-blue-400" data-testid="text-customer-phone">
                {order.customerPhone}
              </a>
            </div>

            {order.customerAddress && (
              <div>
                <p className="text-xs text-muted-foreground">Адрес доставки</p>
                <p className="text-sm" data-testid="text-customer-address">{order.customerAddress}</p>
              </div>
            )}

            {order.customerComment && (
              <div>
                <p className="text-xs text-muted-foreground">Комментарий</p>
                <p className="text-sm" data-testid="text-customer-comment">{order.customerComment}</p>
              </div>
            )}

            {order.paymentMethod && (
              <div>
                <p className="text-xs text-muted-foreground">Способ оплаты</p>
                <p className="text-sm font-semibold" data-testid="text-payment-method">
                  {order.paymentMethod === "whatsapp" ? "WhatsApp" : order.paymentMethod === "kaspi" ? "Kaspi" : order.paymentMethod}
                </p>
              </div>
            )}
          </div>

          {kaspiInfo && order.paymentStatus !== "paid" && (
            <div className="border-t p-4 space-y-3" data-testid="kaspi-payment-section">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                  <Banknote className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">Оплатить через Kaspi</p>
                  <p className="text-[11px] text-muted-foreground">Откройте Kaspi и переведите по номеру</p>
                </div>
              </div>

              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Номер получателя</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400 tracking-wide" data-testid="text-kaspi-phone">
                      {formatKaspiPhone(kaspiInfo.phone)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(kaspiInfo.phone.replace(/\D/g, ""), "phone")}
                    className="shrink-0 gap-1.5"
                    data-testid="button-copy-kaspi-phone"
                  >
                    {copiedField === "phone" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedField === "phone" ? "Скопировано" : "Копировать"}
                  </Button>
                </div>

                {kaspiInfo.recipientName && (
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Получатель</p>
                    <p className="text-sm font-semibold" data-testid="text-kaspi-recipient">{kaspiInfo.recipientName}</p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Сумма к оплате</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400" data-testid="text-kaspi-amount">{formatPrice(order.total)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(String(order.total), "amount")}
                    className="shrink-0 gap-1.5"
                    data-testid="button-copy-kaspi-amount"
                  >
                    {copiedField === "amount" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedField === "amount" ? "Скопировано" : "Копировать"}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 p-3 space-y-1.5">
                <p className="text-xs font-semibold">Как оплатить:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Скопируйте номер получателя</li>
                  <li>Откройте приложение Kaspi</li>
                  <li>Переводы &rarr; По номеру телефона</li>
                  <li>Вставьте номер и укажите сумму <span className="font-semibold text-foreground">{formatPrice(order.total)}</span></li>
                  <li>Подтвердите перевод</li>
                </ol>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
