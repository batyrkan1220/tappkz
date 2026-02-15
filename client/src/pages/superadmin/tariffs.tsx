import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PLAN_PRICES, PLAN_NAMES, PLAN_LIMITS, PLAN_FEATURES, PLAN_ORDER_LIMITS, PLAN_IMAGE_LIMITS } from "@shared/schema";
import { useState, useEffect } from "react";
import { CreditCard, Package, Check, Plus, X, Save, Pencil, Crown, Zap, Star, ShoppingCart, ImageIcon } from "lucide-react";

interface PlanConfig {
  price: number;
  limit: number;
  orderLimit: number;
  imageLimit: number;
  name: string;
  features: string[];
}

const defaultConfigs: Record<string, PlanConfig> = {
  free: { price: PLAN_PRICES.free, limit: PLAN_LIMITS.free, orderLimit: PLAN_ORDER_LIMITS.free, imageLimit: PLAN_IMAGE_LIMITS.free, name: PLAN_NAMES.free, features: PLAN_FEATURES.free },
  business: { price: PLAN_PRICES.business, limit: PLAN_LIMITS.business, orderLimit: PLAN_ORDER_LIMITS.business, imageLimit: PLAN_IMAGE_LIMITS.business, name: PLAN_NAMES.business, features: PLAN_FEATURES.business },
  enterprise: { price: PLAN_PRICES.enterprise, limit: PLAN_LIMITS.enterprise, orderLimit: PLAN_ORDER_LIMITS.enterprise, imageLimit: PLAN_IMAGE_LIMITS.enterprise, name: PLAN_NAMES.enterprise, features: PLAN_FEATURES.enterprise },
};

const planIcons: Record<string, typeof Star> = {
  free: Star,
  business: Zap,
  enterprise: Crown,
};

const planAccents: Record<string, { bg: string; border: string; text: string; icon: string; stripe: string }> = {
  free: {
    bg: "bg-zinc-50 dark:bg-zinc-900/30",
    border: "border-zinc-200 dark:border-zinc-700",
    text: "text-zinc-700 dark:text-zinc-300",
    icon: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
    stripe: "bg-zinc-400",
  },
  business: {
    bg: "bg-blue-50/50 dark:bg-blue-900/10",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    stripe: "bg-blue-500",
  },
  enterprise: {
    bg: "bg-purple-50/50 dark:bg-purple-900/10",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
    icon: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300",
    stripe: "bg-purple-500",
  },
};

function PlanCard({ planKey, config, savedConfig, onSave, isPending }: {
  planKey: string;
  config: PlanConfig;
  savedConfig: PlanConfig | null;
  onSave: (data: PlanConfig) => void;
  isPending: boolean;
}) {
  const currentConfig = savedConfig || config;
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(currentConfig.price);
  const [editLimit, setEditLimit] = useState(currentConfig.limit);
  const [editOrderLimit, setEditOrderLimit] = useState(currentConfig.orderLimit);
  const [editImageLimit, setEditImageLimit] = useState(currentConfig.imageLimit);
  const [editName, setEditName] = useState(currentConfig.name);
  const [editFeatures, setEditFeatures] = useState<string[]>(currentConfig.features);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    const c = savedConfig || config;
    setEditPrice(c.price);
    setEditLimit(c.limit);
    setEditOrderLimit(c.orderLimit ?? -1);
    setEditImageLimit(c.imageLimit ?? -1);
    setEditName(c.name);
    setEditFeatures([...c.features]);
  }, [savedConfig, config]);

  const accent = planAccents[planKey];
  const Icon = planIcons[planKey];

  const handleSave = () => {
    onSave({ price: editPrice, limit: editLimit, orderLimit: editOrderLimit, imageLimit: editImageLimit, name: editName, features: editFeatures });
    setIsEditing(false);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setEditFeatures([...editFeatures, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (idx: number) => {
    setEditFeatures(editFeatures.filter((_, i) => i !== idx));
  };

  const formatLimit = (val: number) => val < 0 ? "Безлимит" : val.toLocaleString("ru-RU");

  return (
    <Card className={`overflow-visible ${accent.bg}`} data-testid={`card-plan-${planKey}`}>
      <div className={`h-1.5 rounded-t-md ${accent.stripe}`} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-48 text-sm font-bold"
                  data-testid={`input-plan-name-${planKey}`}
                />
              ) : (
                <h3 className="text-lg font-bold" data-testid={`text-plan-name-${planKey}`}>{currentConfig.name}</h3>
              )}
              <Badge variant="secondary" className={`${accent.text} mt-0.5`}>
                {planKey.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} data-testid={`button-cancel-${planKey}`}>
                  Отмена
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isPending} data-testid={`button-save-${planKey}`}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Сохранить
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} data-testid={`button-edit-${planKey}`}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Редактировать
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Цена (₸/месяц)
            </label>
            {isEditing ? (
              <Input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                className="h-9"
                data-testid={`input-plan-price-${planKey}`}
              />
            ) : (
              <p className="text-2xl font-extrabold tracking-tight" data-testid={`text-plan-price-${planKey}`}>
                {currentConfig.price > 0 ? `${currentConfig.price.toLocaleString("ru-RU")} ₸` : "Бесплатно"}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Лимит товаров
            </label>
            {isEditing ? (
              <Input
                type="number"
                value={editLimit}
                onChange={(e) => setEditLimit(parseInt(e.target.value) || 1)}
                className="h-9"
                data-testid={`input-plan-limit-${planKey}`}
              />
            ) : (
              <p className="text-2xl font-extrabold tracking-tight" data-testid={`text-plan-limit-${planKey}`}>
                {formatLimit(currentConfig.limit)}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Заказы / мес (-1 = безлимит)
            </label>
            {isEditing ? (
              <Input
                type="number"
                value={editOrderLimit}
                onChange={(e) => setEditOrderLimit(parseInt(e.target.value) || 0)}
                className="h-9"
                data-testid={`input-plan-order-limit-${planKey}`}
              />
            ) : (
              <p className="text-2xl font-extrabold tracking-tight" data-testid={`text-plan-order-limit-${planKey}`}>
                {formatLimit(currentConfig.orderLimit)}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Изображения (-1 = безлимит)
            </label>
            {isEditing ? (
              <Input
                type="number"
                value={editImageLimit}
                onChange={(e) => setEditImageLimit(parseInt(e.target.value) || 0)}
                className="h-9"
                data-testid={`input-plan-image-limit-${planKey}`}
              />
            ) : (
              <p className="text-2xl font-extrabold tracking-tight" data-testid={`text-plan-image-limit-${planKey}`}>
                {formatLimit(currentConfig.imageLimit)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Возможности тарифа</label>
          <div className="space-y-1.5">
            {(isEditing ? editFeatures : currentConfig.features).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className={`h-3.5 w-3.5 flex-shrink-0 ${accent.text}`} />
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <Input
                      value={feature}
                      onChange={(e) => {
                        const updated = [...editFeatures];
                        updated[idx] = e.target.value;
                        setEditFeatures(updated);
                      }}
                      className="h-7 text-xs flex-1"
                      data-testid={`input-feature-${planKey}-${idx}`}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFeature(idx)} data-testid={`button-remove-feature-${planKey}-${idx}`}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm" data-testid={`text-feature-${planKey}-${idx}`}>{feature}</span>
                )}
              </div>
            ))}
            {isEditing && (
              <div className="flex items-center gap-1.5 mt-2">
                <Input
                  placeholder="Новая возможность..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFeature()}
                  className="h-7 text-xs flex-1"
                  data-testid={`input-new-feature-${planKey}`}
                />
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={addFeature} data-testid={`button-add-feature-${planKey}`}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function SuperAdminTariffs() {
  const { toast } = useToast();
  const { data: savedConfigs, isLoading } = useQuery<Record<string, any>>({ queryKey: ["/api/superadmin/tariffs"] });

  const saveMutation = useMutation({
    mutationFn: async ({ plan, data }: { plan: string; data: PlanConfig }) => {
      await apiRequest("PUT", `/api/superadmin/tariffs/${plan}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/tariffs"] });
      toast({ title: "Тариф сохранён" });
    },
    onError: () => toast({ title: "Ошибка сохранения", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  const getConfig = (planKey: string): PlanConfig | null => {
    const key = `plan_${planKey}`;
    if (savedConfigs && savedConfigs[key]) return savedConfigs[key] as PlanConfig;
    return null;
  };

  const plans = ["free", "business", "enterprise"];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-tariffs-title">Тарифы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управление ценами, лимитами и возможностями тарифных планов
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((planKey) => (
          <PlanCard
            key={planKey}
            planKey={planKey}
            config={defaultConfigs[planKey]}
            savedConfig={getConfig(planKey)}
            onSave={(data) => saveMutation.mutate({ plan: planKey, data })}
            isPending={saveMutation.isPending}
          />
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-bold mb-3">Сравнение тарифов</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2.5 pr-4 font-medium text-muted-foreground">Параметр</th>
                {plans.map(p => (
                  <th key={p} className="text-center py-2.5 px-4 font-bold" data-testid={`th-plan-${p}`}>
                    <Badge variant="secondary" className={`${planAccents[p].text}`}>{p.toUpperCase()}</Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2.5 pr-4 text-muted-foreground">Цена</td>
                {plans.map(p => {
                  const cfg = getConfig(p) || defaultConfigs[p];
                  return <td key={p} className="text-center py-2.5 px-4 font-bold">{cfg.price > 0 ? `${cfg.price.toLocaleString("ru-RU")} ₸` : "Бесплатно"}</td>;
                })}
              </tr>
              <tr className="border-b">
                <td className="py-2.5 pr-4 text-muted-foreground">Лимит товаров</td>
                {plans.map(p => {
                  const cfg = getConfig(p) || defaultConfigs[p];
                  return <td key={p} className="text-center py-2.5 px-4 font-bold">{cfg.limit < 0 ? "Безлимит" : cfg.limit.toLocaleString("ru-RU")}</td>;
                })}
              </tr>
              <tr className="border-b">
                <td className="py-2.5 pr-4 text-muted-foreground">Заказы / мес</td>
                {plans.map(p => {
                  const cfg = getConfig(p) || defaultConfigs[p];
                  return <td key={p} className="text-center py-2.5 px-4 font-bold">{cfg.orderLimit < 0 ? "Безлимит" : cfg.orderLimit}</td>;
                })}
              </tr>
              <tr className="border-b">
                <td className="py-2.5 pr-4 text-muted-foreground">Изображения</td>
                {plans.map(p => {
                  const cfg = getConfig(p) || defaultConfigs[p];
                  return <td key={p} className="text-center py-2.5 px-4 font-bold">{cfg.imageLimit < 0 ? "Безлимит" : cfg.imageLimit}</td>;
                })}
              </tr>
              {(() => {
                const allFeatures = new Set<string>();
                plans.forEach(p => {
                  const cfg = getConfig(p) || defaultConfigs[p];
                  cfg.features.forEach(f => allFeatures.add(f));
                });
                return Array.from(allFeatures).map((feature, idx) => (
                  <tr key={idx} className={idx < allFeatures.size - 1 ? "border-b" : ""}>
                    <td className="py-2 pr-4 text-muted-foreground text-xs">{feature}</td>
                    {plans.map(p => {
                      const cfg = getConfig(p) || defaultConfigs[p];
                      const has = cfg.features.includes(feature);
                      return (
                        <td key={p} className="text-center py-2 px-4">
                          {has ? (
                            <Check className={`h-4 w-4 mx-auto ${planAccents[p].text}`} />
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
