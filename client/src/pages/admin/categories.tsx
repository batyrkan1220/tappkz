import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { useBusinessLabels } from "@/hooks/use-business-labels";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Category, Store } from "@shared/schema";

export default function CategoriesPage() {
  useDocumentTitle("Категории");
  const { toast } = useToast();
  const labels = useBusinessLabels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: categories, isLoading } = useQuery<Category[]>({ queryKey: ["/api/my-store/categories"] });

  const openCreate = () => {
    setEditCat(null);
    setName("");
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditCat(c);
    setName(c.name);
    setIsActive(c.isActive);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name, isActive, storeId: store!.id, sortOrder: editCat?.sortOrder ?? 0 };
      if (editCat) {
        await apiRequest("PATCH", `/api/my-store/categories/${editCat.id}`, body);
      } else {
        await apiRequest("POST", "/api/my-store/categories", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/categories"] });
      setDialogOpen(false);
      toast({ title: editCat ? "Категория обновлена" : "Категория создана" });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/my-store/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/categories"] });
      toast({ title: "Категория удалена" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/30">
            <FolderOpen className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-categories-title">Категории</h1>
            <p className="text-xs text-muted-foreground" data-testid="text-categories-count">{categories?.length ?? 0} {labels.group === "fnb" ? "разделов" : "категорий"}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="rounded-full font-semibold" data-testid="button-add-category">
          <Plus className="mr-1.5 h-4 w-4" /> Добавить
        </Button>
      </div>

      {(categories || []).length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed" data-testid="card-empty-categories">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/30">
            <FolderOpen className="h-7 w-7 text-purple-600" />
          </div>
          <p className="font-extrabold tracking-tight">Нет категорий</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.group === "fnb" ? "Создайте разделы для организации меню" : labels.group === "service" ? "Создайте категории для организации услуг" : "Создайте категории для организации товаров"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(categories || []).map((c) => (
            <Card key={c.id} className="flex items-center gap-3 p-3" data-testid={`card-category-${c.id}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <FolderOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold" data-testid={`text-category-name-${c.id}`}>{c.name}</p>
                  {!c.isActive && <Badge variant="secondary">Скрыта</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(c)} data-testid={`button-edit-category-${c.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(c.id)} data-testid={`button-delete-category-${c.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-extrabold tracking-tight">{editCat ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-semibold">Название *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-category-name" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-category-active" />
              <Label className="font-semibold">Активна</Label>
            </div>
            <Button
              className="w-full rounded-full font-semibold"
              onClick={() => saveMutation.mutate()}
              disabled={!name || saveMutation.isPending}
              data-testid="button-save-category"
            >
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
