import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Order } from "@shared/schema";

interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string | null;
  variantTitle?: string | null;
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

export default function InvoicePage() {
  const params = useParams<{ id?: string; slug?: string; orderNumber?: string }>();

  const isSlugFormat = !!params.slug && !!params.orderNumber;
  const apiUrl = isSlugFormat
    ? `/api/orders/${params.slug}/${params.orderNumber}`
    : `/api/orders/${params.id}`;
  const displayNum = isSlugFormat ? params.orderNumber : params.id;

  useDocumentTitle(`Заказ #${displayNum}`);

  const { data, isLoading, error } = useQuery<{ order: Order; storeName: string; storeSlug: string }>({
    queryKey: isSlugFormat ? ["/api/orders", params.slug, params.orderNumber] : ["/api/orders", params.id],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
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

  const { order, storeName, storeSlug } = data;
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
                  {item.variantTitle && (
                    <p className="text-xs text-muted-foreground" data-testid={`text-item-variant-${i}`}>{item.variantTitle}</p>
                  )}
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
            {order.deliveryFee != null && order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span data-testid="text-delivery-fee">{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            {order.discountAmount != null && order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">Скидка{order.discountTitle ? ` (${order.discountTitle})` : ""}</span>
                <span className="text-green-600 dark:text-green-400" data-testid="text-discount-amount">-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
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

            {order.deliveryMethod && (
              <div>
                <p className="text-xs text-muted-foreground">Способ получения</p>
                <p className="text-sm font-semibold" data-testid="text-delivery-method">
                  {order.deliveryMethod === "pickup" ? "Самовывоз" : order.deliveryMethod === "delivery" ? "Доставка курьером" : order.deliveryMethod === "yandex_delivery" ? "Яндекс Доставка" : order.deliveryMethod}
                </p>
              </div>
            )}

            {order.paymentMethod && (
              <div>
                <p className="text-xs text-muted-foreground">Способ заказа</p>
                <p className="text-sm font-semibold" data-testid="text-payment-method">
                  {order.paymentMethod === "whatsapp" ? "WhatsApp" : order.paymentMethod}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
