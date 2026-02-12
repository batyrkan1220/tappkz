import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SiWhatsapp } from "react-icons/si";

export default function CreateStorePage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/stores", {
        name,
        slug,
        whatsappPhone,
        city: city || null,
        description: description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store"] });
      toast({ title: "Магазин создан!" });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === nameToSlug(name)) {
      setSlug(nameToSlug(val));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-5 p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary">
            <SiWhatsapp className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Создайте ваш магазин</h1>
          <p className="text-sm text-muted-foreground">Заполните информацию для начала работы</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Название магазина *</Label>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Мой магазин" data-testid="input-create-store-name" />
          </div>
          <div>
            <Label>URL магазина *</Label>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="shrink-0">/s/</span>
              <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="my-store" data-testid="input-create-store-slug" />
            </div>
          </div>
          <div>
            <Label>Номер WhatsApp *</Label>
            <Input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="77771234567" data-testid="input-create-store-phone" />
          </div>
          <div>
            <Label>Город</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Алматы" data-testid="input-create-store-city" />
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Расскажите о вашем бизнесе" data-testid="input-create-store-desc" />
          </div>

          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={!name || !slug || !whatsappPhone || createMutation.isPending}
            data-testid="button-create-store"
          >
            {createMutation.isPending ? "Создание..." : "Создать магазин"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => {
      const map: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
      return map[c] || c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
