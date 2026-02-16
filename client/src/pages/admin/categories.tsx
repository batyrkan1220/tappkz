import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FolderOpen, X, ImageIcon, GripVertical, Package } from "lucide-react";
import { useBusinessLabels } from "@/hooks/use-business-labels";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Category, Store, Product } from "@shared/schema";

export default function CategoriesPage() {
  useDocumentTitle("Категории");
  const { toast } = useToast();
  const labels = useBusinessLabels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const { data: store } = useQuery<Store>({ queryKey: ["/api/my-store"] });
  const { data: categories, isLoading } = useQuery<Category[]>({ queryKey: ["/api/my-store/categories"] });
  const { data: products } = useQuery<Product[]>({ queryKey: ["/api/my-store/products"] });

  const productCountMap = useCallback(() => {
    const map: Record<number, number> = {};
    (products || []).forEach((p) => {
      if (p.categoryId) {
        map[p.categoryId] = (map[p.categoryId] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  const openCreate = () => {
    setEditCat(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditCat(c);
    setName(c.name);
    setDescription((c as any).description || "");
    setImageUrl((c as any).imageUrl || "");
    setIsActive(c.isActive);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setImageUrl(data.url);
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: any = { name, isActive, storeId: store!.id, sortOrder: editCat?.sortOrder ?? (categories?.length ?? 0), description: description || null, imageUrl: imageUrl || null };
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

  const reorderMutation = useMutation({
    mutationFn: async (order: number[]) => {
      await apiRequest("PUT", "/api/my-store/categories/reorder", { order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/categories"] });
    },
  });

  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDrop = (targetId: number) => {
    if (draggedId === null || draggedId === targetId || !categories) return;
    const sorted = [...categories];
    const fromIndex = sorted.findIndex((c) => c.id === draggedId);
    const toIndex = sorted.findIndex((c) => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    const newOrder = sorted.map((c) => c.id);
    reorderMutation.mutate(newOrder);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const counts = productCountMap();

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

      {(categories || []).length > 1 && (
        <p className="text-xs text-muted-foreground">Перетащите категории для изменения порядка</p>
      )}

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
            <Card
              key={c.id}
              className={`flex items-center gap-3 p-3 transition-all ${dragOverId === c.id ? "ring-2 ring-primary" : ""} ${draggedId === c.id ? "opacity-50" : ""}`}
              draggable
              onDragStart={() => handleDragStart(c.id)}
              onDragOver={(e) => handleDragOver(e, c.id)}
              onDrop={() => handleDrop(c.id)}
              onDragEnd={handleDragEnd}
              data-testid={`card-category-${c.id}`}
            >
              <div className="cursor-grab text-muted-foreground" data-testid={`drag-handle-category-${c.id}`}>
                <GripVertical className="h-4 w-4" />
              </div>
              {(c as any).imageUrl ? (
                <img src={`/uploads/thumbs/${((c as any).imageUrl as string).replace("/uploads/", "")}`} alt={c.name} className="h-11 w-11 rounded-lg object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <FolderOpen className="h-5 w-5 text-purple-600" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold" data-testid={`text-category-name-${c.id}`}>{c.name}</p>
                  {!c.isActive && <Badge variant="secondary">Скрыта</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {(c as any).description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{(c as any).description}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span data-testid={`text-category-count-${c.id}`}>{counts[c.id] || 0}</span>
                  </div>
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
            <div>
              <Label className="font-semibold">Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание категории"
                data-testid="input-category-description"
              />
            </div>
            <div>
              <Label className="font-semibold">Иконка / фото</Label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              {imageUrl ? (
                <div className="mt-2 flex items-center gap-3">
                  <img src={imageUrl} alt="category" className="h-16 w-16 rounded-lg object-cover" />
                  <Button size="icon" variant="ghost" onClick={() => setImageUrl("")} data-testid="button-remove-category-image">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="button-upload-category-image"
                >
                  {uploading ? "Загрузка..." : <><ImageIcon className="mr-2 h-4 w-4" /> Загрузить фото</>}
                </Button>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Отображается рядом с названием категории на витрине</p>
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
