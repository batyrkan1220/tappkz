import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Search, Plus, Percent, ShoppingCart, Zap, Package, Gift, Truck, Trash2, Pencil, Tag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { DISCOUNT_TYPES, type Discount, type DiscountType } from "@shared/schema";

const TYPE_ICONS: Record<string, any> = {
  code: Tag,
  order_amount: ShoppingCart,
  automatic: Zap,
  bundle: Package,
  buy_x_get_y: Gift,
  free_delivery: Truck,
};

const TYPE_COLORS: Record<string, string> = {
  code: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  order_amount: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  automatic: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  bundle: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  buy_x_get_y: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  free_delivery: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

function formatValue(d: Discount) {
  if (d.valueType === "free") return "Бесплатно";
  if (d.valueType === "percentage") return `${d.value}%`;
  return new Intl.NumberFormat("ru-KZ").format(d.value) + " ₸";
}

function formatDate(date: string | Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DiscountsPage() {
  useDocumentTitle("Скидки — Tapp");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const { data: discounts = [], isLoading } = useQuery<Discount[]>({
    queryKey: ["/api/my-store/discounts"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/my-store/discounts/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/discounts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/my-store/discounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/discounts"] });
      toast({ title: "Скидка удалена" });
    },
  });

  const filtered = discounts.filter((d) =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
  );

  if (showTypeSelector) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={() => setShowTypeSelector(false)} data-testid="button-back-discounts">
            ← Назад
          </Button>
          <h1 className="text-xl font-bold" data-testid="text-discount-type-title">Выберите тип скидки</h1>
        </div>
        <div className="space-y-3">
          {(Object.entries(DISCOUNT_TYPES) as [DiscountType, typeof DISCOUNT_TYPES[DiscountType]][]).map(([key, info]) => {
            const Icon = TYPE_ICONS[key];
            return (
              <Card
                key={key}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => setLocation(`/admin/discounts/new?type=${key}`)}
                data-testid={`card-discount-type-${key}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${TYPE_COLORS[key]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-xl font-bold" data-testid="text-discounts-title">Скидки</h1>
        <Button onClick={() => setShowTypeSelector(true)} data-testid="button-create-discount">
          <Plus className="h-4 w-4 mr-1" />
          Создать скидку
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или коду..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-discounts"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Percent className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold mb-1" data-testid="text-discounts-empty">Нет скидок</p>
          <p className="text-sm text-muted-foreground mb-4">Создайте первую скидку для вашего магазина</p>
          <Button onClick={() => setShowTypeSelector(true)} data-testid="button-create-discount-empty">
            <Plus className="h-4 w-4 mr-1" />
            Создать скидку
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const Icon = TYPE_ICONS[d.type] || Percent;
            const typeInfo = DISCOUNT_TYPES[d.type as DiscountType];
            return (
              <Card key={d.id} className="p-4" data-testid={`card-discount-${d.id}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md shrink-0 ${TYPE_COLORS[d.type] || "bg-muted"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm" data-testid={`text-discount-title-${d.id}`}>{d.title}</p>
                      {d.code && (
                        <Badge variant="outline" className="text-[10px] font-mono no-default-hover-elevate no-default-active-elevate" data-testid={`badge-discount-code-${d.id}`}>
                          {d.code}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] no-default-hover-elevate no-default-active-elevate">
                        {typeInfo?.label || d.type}
                      </Badge>
                      <span className="text-xs font-semibold text-muted-foreground">{formatValue(d)}</span>
                      {d.currentUses > 0 && (
                        <span className="text-xs text-muted-foreground">{d.currentUses} исп.</span>
                      )}
                      {d.startDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(d.startDate)}{d.endDate ? ` — ${formatDate(d.endDate)}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={d.isActive}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: d.id, isActive: checked })}
                      data-testid={`switch-discount-active-${d.id}`}
                    />
                    <Link href={`/admin/discounts/${d.id}`}>
                      <Button size="icon" variant="ghost" data-testid={`button-edit-discount-${d.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Удалить скидку?")) deleteMutation.mutate(d.id);
                      }}
                      data-testid={`button-delete-discount-${d.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
