import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SiWhatsapp } from "react-icons/si";
import { MessageCircle } from "lucide-react";
import { InternationalPhoneInput } from "@/components/international-phone-input";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Store, StoreSettings } from "@shared/schema";

const DEFAULT_TEMPLATE = "Новый заказ из {store_name}!\n\nКлиент: {customer_name}\nТелефон: {customer_phone}\nАдрес: {address}\nКомментарий: {comment}\n\nТовары:\n{items}\n\nИтого: {total} ₸";

export default function WhatsAppPage() {
  useDocumentTitle("WhatsApp");
  const { toast } = useToast();
  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: settings, isLoading } = useQuery<StoreSettings>({ queryKey: ["/api/my-store/settings"] });

  const [phone, setPhone] = useState("");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);

  useEffect(() => {
    if (store) setPhone(store.whatsappPhone || "");
    if (settings) setTemplate(settings.whatsappTemplate || DEFAULT_TEMPLATE);
  }, [store, settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/my-store/whatsapp", { phone, template });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/settings"] });
      toast({ title: "Настройки WhatsApp сохранены" });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const previewMsg = template
    .replace("{store_name}", store?.name || "Магазин")
    .replace("{customer_name}", "Алия Нурланова")
    .replace("{customer_phone}", "+7 777 123 45 67")
    .replace("{address}", "ул. Абая 1, кв 10")
    .replace("{comment}", "Побыстрее, пожалуйста")
    .replace("{items}", "1x Товар A - 5 000 ₸\n2x Товар B - 3 000 ₸")
    .replace("{total}", "11 000");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/30">
          <MessageCircle className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-whatsapp-title">Настройки WhatsApp</h1>
          <p className="text-xs text-muted-foreground">Управление чекаутом и шаблоном сообщений</p>
        </div>
      </div>

      <Card className="space-y-5 p-5">
        <div>
          <Label className="mb-1 block font-semibold">Номер WhatsApp</Label>
          <p className="mb-2 text-xs text-muted-foreground">Введите номер в формате +7 (XXX) XXX-XX-XX</p>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white">
              <SiWhatsapp className="h-4 w-4" />
            </div>
            <InternationalPhoneInput
              value={phone}
              onValueChange={setPhone}
              data-testid="input-whatsapp-phone"
            />
          </div>
        </div>

        <div>
          <Label className="mb-1 block font-semibold">Шаблон сообщения</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Переменные: {"{store_name}"}, {"{customer_name}"}, {"{customer_phone}"}, {"{address}"}, {"{comment}"}, {"{items}"}, {"{total}"}
          </p>
          <Textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={10}
            className="font-mono text-sm"
            data-testid="input-whatsapp-template"
          />
        </div>

        <div>
          <Label className="mb-2 block font-semibold">Предпросмотр сообщения</Label>
          <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
            <pre className="whitespace-pre-wrap text-sm" data-testid="text-whatsapp-preview">{previewMsg}</pre>
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={!phone || phone.replace(/\D/g, "").length < 11 || saveMutation.isPending} className="rounded-full font-semibold" data-testid="button-save-whatsapp">
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </Card>
    </div>
  );
}
