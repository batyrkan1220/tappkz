import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Truck, MapPin, Loader2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";
interface DeliverySettings {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFee: number | null;
  deliveryFreeThreshold: number | null;
  pickupAddress: string | null;
  deliveryZone: string | null;
}

export default function DeliveryPage() {
  useDocumentTitle("Доставка");
  const { toast } = useToast();

  const { data, isLoading } = useQuery<DeliverySettings>({
    queryKey: ["/api/my-store/delivery"],
  });

  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryFreeThreshold, setDeliveryFreeThreshold] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupStreet, setPickupStreet] = useState("");
  const [pickupApt, setPickupApt] = useState("");
  const [pickupFloor, setPickupFloor] = useState("");
  const [pickupIntercom, setPickupIntercom] = useState("");
  const [pickupComment, setPickupComment] = useState("");
  const [deliveryZone, setDeliveryZone] = useState("");

  const parseAddress = (addr: string | null) => {
    if (!addr) return { city: "", street: "", apt: "", floor: "", intercom: "", comment: "" };
    const parts = addr.split(", ");
    const result = { city: "", street: "", apt: "", floor: "", intercom: "", comment: "" };
    const extras: string[] = [];
    for (const p of parts) {
      if (p.startsWith("кв/офис ")) result.apt = p.replace("кв/офис ", "");
      else if (p.startsWith("этаж ")) result.floor = p.replace("этаж ", "");
      else if (p.startsWith("домофон ")) result.intercom = p.replace("домофон ", "");
      else if (!result.city) result.city = p;
      else if (!result.street) result.street = p;
      else extras.push(p);
    }
    result.comment = extras.join(", ");
    return result;
  };

  const buildAddress = (city: string, street: string, apt: string, floor: string, intercom: string, comment: string) => {
    return [
      city, street,
      apt ? `кв/офис ${apt}` : "",
      floor ? `этаж ${floor}` : "",
      intercom ? `домофон ${intercom}` : "",
      comment,
    ].filter(Boolean).join(", ") || null;
  };

  useEffect(() => {
    if (data) {
      setDeliveryEnabled(data.deliveryEnabled);
      setPickupEnabled(data.pickupEnabled);
      setDeliveryFee(data.deliveryFee !== null ? String(data.deliveryFee) : "");
      setDeliveryFreeThreshold(data.deliveryFreeThreshold !== null ? String(data.deliveryFreeThreshold) : "");
      const parsed = parseAddress(data.pickupAddress);
      setPickupCity(parsed.city);
      setPickupStreet(parsed.street);
      setPickupApt(parsed.apt);
      setPickupFloor(parsed.floor);
      setPickupIntercom(parsed.intercom);
      setPickupComment(parsed.comment);
      setDeliveryZone(data.deliveryZone || "");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/my-store/delivery", {
        deliveryEnabled,
        pickupEnabled,
        deliveryFee: deliveryFee ? parseInt(deliveryFee) : null,
        deliveryFreeThreshold: deliveryFreeThreshold ? parseInt(deliveryFreeThreshold) : null,
        pickupAddress: buildAddress(pickupCity, pickupStreet, pickupApt, pickupFloor, pickupIntercom, pickupComment),
        deliveryZone: deliveryZone || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/delivery"] });
      toast({ title: "Сохранено", description: "Настройки доставки обновлены" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось сохранить", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-delivery-title">
          <Truck className="h-5 w-5" />
          Доставка
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Настройте способы получения заказов для покупателей</p>
      </div>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Самовывоз</p>
              <p className="text-xs text-muted-foreground">Покупатель забирает заказ сам</p>
            </div>
          </div>
          <Switch
            checked={pickupEnabled}
            onCheckedChange={setPickupEnabled}
            data-testid="switch-pickup-enabled"
          />
        </div>

        {pickupEnabled && (
          <div className="pl-[52px] space-y-3">
            <Label className="text-xs font-medium text-muted-foreground block">Адрес самовывоза</Label>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Город</Label>
              <Input
                value={pickupCity}
                onChange={(e) => setPickupCity(e.target.value)}
                placeholder="Алматы"
                data-testid="input-pickup-city"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Адрес (улица, дом)</Label>
              <Input
                value={pickupStreet}
                onChange={(e) => setPickupStreet(e.target.value)}
                placeholder="ул. Абая 1"
                data-testid="input-pickup-street"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Кв/Офис</Label>
                <Input
                  value={pickupApt}
                  onChange={(e) => setPickupApt(e.target.value)}
                  placeholder="10"
                  data-testid="input-pickup-apt"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Этаж</Label>
                <Input
                  value={pickupFloor}
                  onChange={(e) => setPickupFloor(e.target.value)}
                  placeholder="3"
                  data-testid="input-pickup-floor"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Домофон</Label>
                <Input
                  value={pickupIntercom}
                  onChange={(e) => setPickupIntercom(e.target.value)}
                  placeholder="1234"
                  data-testid="input-pickup-intercom"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Комментарий к адресу</Label>
              <Input
                value={pickupComment}
                onChange={(e) => setPickupComment(e.target.value)}
                placeholder="Ориентир, подъезд и т.д."
                data-testid="input-pickup-comment"
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Своя доставка</p>
              <p className="text-xs text-muted-foreground">Доставка вашим курьером</p>
            </div>
          </div>
          <Switch
            checked={deliveryEnabled}
            onCheckedChange={setDeliveryEnabled}
            data-testid="switch-delivery-enabled"
          />
        </div>

        {deliveryEnabled && (
          <div className="pl-[52px] space-y-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Стоимость доставки (₸)</Label>
              <Input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="1000"
                data-testid="input-delivery-fee"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Оставьте пустым для бесплатной доставки</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Бесплатная доставка от (₸)</Label>
              <Input
                type="number"
                value={deliveryFreeThreshold}
                onChange={(e) => setDeliveryFreeThreshold(e.target.value)}
                placeholder="10000"
                data-testid="input-delivery-free-threshold"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Бесплатная доставка при заказе на эту сумму и выше</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Зона доставки</Label>
              <Input
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value)}
                placeholder="Алматы и Алматинская область"
                data-testid="input-delivery-zone"
              />
            </div>
          </div>
        )}
      </Card>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        data-testid="button-save-delivery"
      >
        {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Сохранить
      </Button>
    </div>
  );
}
