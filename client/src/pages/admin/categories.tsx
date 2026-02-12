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
import type { Category, Store } from "@shared/schema";

export default function CategoriesPage() {
  const { toast } = useToast();
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
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Категории</h1>
        <Button onClick={openCreate} data-testid="button-add-category">
          <Plus className="mr-1 h-4 w-4" /> Добавить
        </Button>
      </div>

      {(categories || []).length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FolderOpen className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium">Нет категорий</p>
          <p className="text-sm text-muted-foreground">Создайте категории для организации товаров</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(categories || []).map((c) => (
            <Card key={c.id} className="flex items-center gap-3 p-3" data-testid={`card-category-${c.id}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium" data-testid={`text-category-name-${c.id}`}>{c.name}</p>
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
            <DialogTitle>{editCat ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-category-name" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-category-active" />
              <Label>Активна</Label>
            </div>
            <Button
              className="w-full"
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
