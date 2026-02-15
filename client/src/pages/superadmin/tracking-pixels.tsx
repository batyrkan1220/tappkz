import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Save } from "lucide-react";
import { SiFacebook, SiTiktok } from "react-icons/si";
import { useDocumentTitle } from "@/hooks/use-document-title";

interface TrackingPixels {
  facebookPixelId: string;
  tiktokPixelId: string;
}

export default function TrackingPixelsPage() {
  useDocumentTitle("Пиксели отслеживания");
  const { toast } = useToast();

  const { data: pixels, isLoading } = useQuery<TrackingPixels>({
    queryKey: ["/api/superadmin/tracking-pixels"],
  });

  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");

  useEffect(() => {
    if (pixels) {
      setFacebookPixelId(pixels.facebookPixelId || "");
      setTiktokPixelId(pixels.tiktokPixelId || "");
    }
  }, [pixels]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/superadmin/tracking-pixels", {
        facebookPixelId: facebookPixelId || "",
        tiktokPixelId: tiktokPixelId || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/tracking-pixels"] });
      toast({ title: "Пиксели сохранены" });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/30">
          <BarChart3 className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-tracking-title">Пиксели отслеживания</h1>
          <p className="text-xs text-muted-foreground">Платформенные пиксели, которые работают на всех витринах</p>
        </div>
      </div>

      <Card className="space-y-5 p-5">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Эти пиксели будут автоматически установлены на все витрины магазинов платформы. Каждый магазин также может добавить свои собственные пиксели в настройках.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <SiFacebook className="h-4 w-4 text-blue-600" />
              <Label className="font-semibold">Facebook Pixel ID</Label>
            </div>
            <Input
              value={facebookPixelId}
              onChange={(e) => setFacebookPixelId(e.target.value.replace(/\D/g, ""))}
              placeholder="123456789012345"
              data-testid="input-platform-facebook-pixel"
            />
            <p className="mt-1 text-xs text-muted-foreground">Пиксель Facebook/Meta для отслеживания конверсий на всей платформе</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <SiTiktok className="h-4 w-4" />
              <Label className="font-semibold">TikTok Pixel ID</Label>
            </div>
            <Input
              value={tiktokPixelId}
              onChange={(e) => setTiktokPixelId(e.target.value)}
              placeholder="ABCDEFG123456"
              data-testid="input-platform-tiktok-pixel"
            />
            <p className="mt-1 text-xs text-muted-foreground">Пиксель TikTok для отслеживания конверсий на всей платформе</p>
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="rounded-full font-semibold"
          data-testid="button-save-tracking-pixels"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-extrabold tracking-tight mb-2">Как это работает</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-foreground">1.</span>
            Платформенные пиксели загружаются на все витрины магазинов
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-foreground">2.</span>
            Магазины могут добавить свои пиксели через настройки магазина
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-foreground">3.</span>
            При наличии обоих — загружаются и платформенные, и магазинные пиксели
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-foreground">4.</span>
            Отслеживаются события: PageView, AddToCart, InitiateCheckout, Purchase
          </li>
        </ul>
      </Card>
    </div>
  );
}
