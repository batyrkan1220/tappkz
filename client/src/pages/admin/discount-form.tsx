import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link, useLocation, useParams, useSearch } from "wouter";
import { DISCOUNT_TYPES, type Discount, type DiscountType, type Product, type Category } from "@shared/schema";

function formatDate(d: Date | string | null) {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().slice(0, 16);
}

export default function DiscountFormPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const isNew = params.id === "new";
  const discountId = isNew ? null : Number(params.id);
  const typeFromUrl = urlParams.get("type") as DiscountType | null;

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({
    type: typeFromUrl || "code",
    title: "",
    code: "",
    isActive: true,
    valueType: "percentage",
    value: 0,
    appliesTo: "orders",
    targetProductIds: [] as number[],
    targetCategoryIds: [] as number[],
    buyProductIds: [] as number[],
    getProductIds: [] as number[],
    minRequirement: "none",
    minValue: 0,
    maxTotalUses: null as number | null,
    maxPerCustomer: null as number | null,
    maxTotalAmount: null as number | null,
    startDate: formatDate(new Date()),
    endDate: "",
  });

  useDocumentTitle(isNew ? "Новая скидка — Tapp" : "Редактирование скидки — Tapp");

  const { data: discount, isLoading: loadingDiscount } = useQuery<Discount>({
    queryKey: ["/api/my-store/discounts", discountId],
    enabled: !!discountId,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/my-store/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/my-store/categories"],
  });

  useEffect(() => {
    if (discount) {
      setForm({
        type: discount.type,
        title: discount.title,
        code: discount.code || "",
        isActive: discount.isActive,
        valueType: discount.valueType,
        value: discount.value,
        appliesTo: discount.appliesTo,
        targetProductIds: (discount.targetProductIds as number[]) || [],
        targetCategoryIds: (discount.targetCategoryIds as number[]) || [],
        buyProductIds: (discount.buyProductIds as number[]) || [],
        getProductIds: (discount.getProductIds as number[]) || [],
        minRequirement: discount.minRequirement,
        minValue: discount.minValue || 0,
        maxTotalUses: discount.maxTotalUses,
        maxPerCustomer: discount.maxPerCustomer,
        maxTotalAmount: discount.maxTotalAmount,
        startDate: discount.startDate ? formatDate(discount.startDate) : "",
        endDate: discount.endDate ? formatDate(discount.endDate) : "",
      });
    }
  }, [discount]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...form,
        value: Number(form.value) || 0,
        minValue: Number(form.minValue) || 0,
        maxTotalUses: form.maxTotalUses ? Number(form.maxTotalUses) : null,
        maxPerCustomer: form.maxPerCustomer ? Number(form.maxPerCustomer) : null,
        maxTotalAmount: form.maxTotalAmount ? Number(form.maxTotalAmount) : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        code: form.type === "code" ? form.code.toUpperCase() : null,
      };
      if (form.type === "free_delivery") {
        payload.valueType = "free";
        payload.value = 0;
      }
      if (discountId) {
        await apiRequest("PATCH", `/api/my-store/discounts/${discountId}`, payload);
      } else {
        await apiRequest("POST", "/api/my-store/discounts", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/discounts"] });
      toast({ title: isNew ? "Скидка создана" : "Скидка обновлена" });
      setLocation("/admin/discounts");
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  if (!isNew && loadingDiscount) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const typeInfo = DISCOUNT_TYPES[form.type as DiscountType];
  const showCode = form.type === "code";
  const showValue = form.type !== "free_delivery";
  const showAppliesTo = ["code", "order_amount", "automatic"].includes(form.type);
  const showBuyProducts = form.type === "buy_x_get_y";
  const showBundleProducts = form.type === "bundle";

  const toggleProductId = (list: number[], id: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/discounts">
          <Button variant="ghost" size="icon" data-testid="button-back-discount-form">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-discount-form-title">
            {isNew ? "Новая скидка" : "Редактирование скидки"}
          </h1>
          <p className="text-sm text-muted-foreground">{typeInfo?.label}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Label className="font-semibold">Активна</Label>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              data-testid="switch-discount-active"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Название *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Например: Скидка 10%"
              data-testid="input-discount-title"
            />
          </div>

          {showCode && (
            <div>
              <Label className="text-sm font-medium">Промокод *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SALE10"
                className="font-mono"
                data-testid="input-discount-code"
              />
            </div>
          )}
        </Card>

        {showValue && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Значение скидки</h3>
            <div className="flex gap-2">
              <Button
                variant={form.valueType === "percentage" ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, valueType: "percentage" }))}
                className="flex-1"
                data-testid="button-value-percentage"
              >
                Процент (%)
              </Button>
              <Button
                variant={form.valueType === "fixed" ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, valueType: "fixed" }))}
                className="flex-1"
                data-testid="button-value-fixed"
              >
                Фиксированная (₸)
              </Button>
            </div>
            <div>
              <Label className="text-sm font-medium">
                {form.valueType === "percentage" ? "Процент скидки" : "Сумма скидки (₸)"}
              </Label>
              <Input
                type="number"
                value={form.value || ""}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                placeholder={form.valueType === "percentage" ? "10" : "500"}
                min={0}
                max={form.valueType === "percentage" ? 100 : undefined}
                data-testid="input-discount-value"
              />
            </div>
          </Card>
        )}

        {showAppliesTo && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Применяется к</h3>
            <Select
              value={form.appliesTo}
              onValueChange={(v) => setForm((f) => ({ ...f, appliesTo: v }))}
            >
              <SelectTrigger data-testid="select-applies-to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">Весь заказ</SelectItem>
                <SelectItem value="products">Определённые товары</SelectItem>
                <SelectItem value="categories">Определённые категории</SelectItem>
              </SelectContent>
            </Select>

            {form.appliesTo === "products" && (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Нет товаров</p>
                ) : products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover-elevate cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.targetProductIds.includes(p.id)}
                      onChange={() => setForm((f) => ({ ...f, targetProductIds: toggleProductId(f.targetProductIds, p.id) }))}
                      data-testid={`checkbox-product-${p.id}`}
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            )}

            {form.appliesTo === "categories" && (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Нет категорий</p>
                ) : categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 p-1.5 rounded hover-elevate cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.targetCategoryIds.includes(c.id)}
                      onChange={() => setForm((f) => ({ ...f, targetCategoryIds: toggleProductId(f.targetCategoryIds, c.id) }))}
                      data-testid={`checkbox-category-${c.id}`}
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
          </Card>
        )}

        {showBundleProducts && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Товары в комплекте</h3>
            <p className="text-xs text-muted-foreground">Выберите товары, которые нужно купить вместе для получения скидки</p>
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover-elevate cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.targetProductIds.includes(p.id)}
                    onChange={() => setForm((f) => ({ ...f, targetProductIds: toggleProductId(f.targetProductIds, p.id) }))}
                    data-testid={`checkbox-bundle-product-${p.id}`}
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
            </div>
          </Card>
        )}

        {showBuyProducts && (
          <>
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Клиент покупает (X)</h3>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover-elevate cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.buyProductIds.includes(p.id)}
                      onChange={() => setForm((f) => ({ ...f, buyProductIds: toggleProductId(f.buyProductIds, p.id) }))}
                      data-testid={`checkbox-buy-product-${p.id}`}
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </Card>
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Клиент получает (Y)</h3>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover-elevate cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={form.getProductIds.includes(p.id)}
                      onChange={() => setForm((f) => ({ ...f, getProductIds: toggleProductId(f.getProductIds, p.id) }))}
                      data-testid={`checkbox-get-product-${p.id}`}
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </Card>
          </>
        )}

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">Минимальные требования</h3>
          <Select
            value={form.minRequirement}
            onValueChange={(v) => setForm((f) => ({ ...f, minRequirement: v }))}
          >
            <SelectTrigger data-testid="select-min-requirement">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Нет</SelectItem>
              <SelectItem value="amount">Минимальная сумма заказа</SelectItem>
              <SelectItem value="quantity">Минимальное кол-во товаров</SelectItem>
            </SelectContent>
          </Select>
          {form.minRequirement !== "none" && (
            <div>
              <Label className="text-sm font-medium">
                {form.minRequirement === "amount" ? "Минимальная сумма (₸)" : "Минимальное количество"}
              </Label>
              <Input
                type="number"
                value={form.minValue || ""}
                onChange={(e) => setForm((f) => ({ ...f, minValue: Number(e.target.value) }))}
                min={0}
                data-testid="input-min-value"
              />
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">Лимиты использования</h3>
          <div>
            <Label className="text-sm font-medium">Макс. использований (всего)</Label>
            <Input
              type="number"
              value={form.maxTotalUses ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, maxTotalUses: e.target.value ? Number(e.target.value) : null }))}
              placeholder="Без ограничений"
              min={0}
              data-testid="input-max-total-uses"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Макс. использований на клиента</Label>
            <Input
              type="number"
              value={form.maxPerCustomer ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, maxPerCustomer: e.target.value ? Number(e.target.value) : null }))}
              placeholder="Без ограничений"
              min={0}
              data-testid="input-max-per-customer"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Макс. сумма скидок (₸)</Label>
            <Input
              type="number"
              value={form.maxTotalAmount ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, maxTotalAmount: e.target.value ? Number(e.target.value) : null }))}
              placeholder="Без ограничений"
              min={0}
              data-testid="input-max-total-amount"
            />
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm">Период действия</h3>
          <div>
            <Label className="text-sm font-medium">Дата начала</Label>
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              data-testid="input-start-date"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Дата окончания (необязательно)</Label>
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              data-testid="input-end-date"
            />
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/admin/discounts">
            <Button variant="outline" data-testid="button-cancel-discount">Отмена</Button>
          </Link>
          <Button
            onClick={() => {
              if (!form.title.trim()) {
                toast({ title: "Введите название скидки", variant: "destructive" });
                return;
              }
              if (form.type === "code" && !form.code.trim()) {
                toast({ title: "Введите промокод", variant: "destructive" });
                return;
              }
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending}
            data-testid="button-save-discount"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {isNew ? "Создать" : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
