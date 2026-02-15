import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Trash2, Pencil, ShoppingBag, TrendingUp } from "lucide-react";
import { PhoneInput } from "@/components/phone-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDocumentTitle } from "@/hooks/use-document-title";
import type { Customer } from "@shared/schema";

type CustomerWithStatus = Customer & {
  confirmedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  earliestOrderAt: string | null;
};

const THREE_HOURS = 3 * 60 * 60 * 1000;

function getCustomerStatus(customer: CustomerWithStatus): { label: string; className: string } {
  const confirmed = customer.confirmedOrders || 0;
  const pending = customer.pendingOrders || 0;
  const total = customer.totalOrders || 0;

  if (total === 0) return { label: "Новый", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" };

  if (confirmed >= 5) return { label: "Лояльный", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
  if (confirmed >= 2) return { label: "Постоянный", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" };
  if (confirmed === 1) return { label: "Первый заказ", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" };

  if (pending > 0) {
    const isRecent = customer.earliestOrderAt &&
      (Date.now() - new Date(customer.earliestOrderAt).getTime()) < THREE_HOURS;
    if (isRecent) return { label: "Новый", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" };
    return { label: "Ожидает подтверждения", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
  }

  return { label: "Не заказал", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
}

const FILTER_TABS = [
  { key: "all", label: "Все" },
  { key: "new", label: "Новые" },
  { key: "awaiting", label: "Ожидают" },
  { key: "not_ordered", label: "Не заказал" },
  { key: "first_order", label: "Первый заказ" },
  { key: "regular", label: "Постоянные" },
  { key: "loyal", label: "Лояльные" },
];

function formatDate(date: string | Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Almaty",
  });
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("ru-KZ").format(amount) + " ₸";
}

export default function CustomersPage() {
  useDocumentTitle("Клиенты");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data: customers = [], isLoading } = useQuery<CustomerWithStatus[]>({
    queryKey: ["/api/my-store/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string; email?: string; notes?: string }) => {
      await apiRequest("POST", "/api/my-store/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/customers"] });
      setAddOpen(false);
      toast({ title: "Клиент добавлен" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось добавить клиента", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, any> }) => {
      await apiRequest("PATCH", `/api/my-store/customers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/customers"] });
      setEditCustomer(null);
      toast({ title: "Клиент обновлён" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось обновить клиента", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/my-store/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-store/customers"] });
      toast({ title: "Клиент удалён" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось удалить клиента", variant: "destructive" });
    },
  });

  const filteredCustomers = customers.filter((c) => {
    const status = getCustomerStatus(c);
    if (filter === "new" && status.label !== "Новый") return false;
    if (filter === "awaiting" && status.label !== "Ожидает подтверждения") return false;
    if (filter === "not_ordered" && status.label !== "Не заказал") return false;
    if (filter === "first_order" && status.label !== "Первый заказ") return false;
    if (filter === "regular" && status.label !== "Постоянный") return false;
    if (filter === "loyal" && status.label !== "Лояльный") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalSpentAll = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const totalOrdersAll = customers.reduce((s, c) => s + (c.totalOrders || 0), 0);
  const avgOrderValue = totalOrdersAll > 0 ? Math.round(totalSpentAll / totalOrdersAll) : 0;

  const statusCounts = {
    new: customers.filter((c) => getCustomerStatus(c).label === "Новый").length,
    awaiting: customers.filter((c) => getCustomerStatus(c).label === "Ожидает подтверждения").length,
    not_ordered: customers.filter((c) => getCustomerStatus(c).label === "Не заказал").length,
    first_order: customers.filter((c) => getCustomerStatus(c).label === "Первый заказ").length,
    regular: customers.filter((c) => getCustomerStatus(c).label === "Постоянный").length,
    loyal: customers.filter((c) => getCustomerStatus(c).label === "Лояльный").length,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" data-testid="text-customers-title">Клиенты</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-customer">
                <Plus className="h-4 w-4 mr-1" />
                Добавить клиента
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить клиента</DialogTitle>
              </DialogHeader>
              <CustomerForm
                onSubmit={(data) => createMutation.mutate(data)}
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Всего клиентов</p>
          <p className="text-xl font-bold" data-testid="text-stat-total">{customers.length}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Общая выручка</p>
          <p className="text-xl font-bold" data-testid="text-stat-revenue">{formatPrice(totalSpentAll)}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Всего заказов</p>
          <p className="text-xl font-bold" data-testid="text-stat-orders">{totalOrdersAll}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Средний чек</p>
          <p className="text-xl font-bold" data-testid="text-stat-avg">{formatPrice(avgOrderValue)}</p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, телефону, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-customers-search"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === "all" ? customers.length : statusCounts[tab.key as keyof typeof statusCounts] || 0;
          return (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(tab.key)}
              data-testid={`button-filter-${tab.key}`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1 text-xs opacity-70">{count}</span>
              )}
            </Button>
          );
        })}
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Клиент</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Статус</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Заказы</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Потрачено</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Первый заказ</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Последний заказ</th>
                <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Заметки</th>
                <th className="text-right p-3 font-medium text-muted-foreground whitespace-nowrap">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    {customers.length === 0 ? "Клиентов пока нет" : "Ничего не найдено"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const status = getCustomerStatus(customer);
                  return (
                    <tr
                      key={customer.id}
                      className="border-b last:border-b-0"
                      data-testid={`row-customer-${customer.id}`}
                    >
                      <td className="p-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[180px]" data-testid={`text-customer-name-${customer.id}`}>
                            {customer.name}
                          </p>
                          {customer.phone && (
                            <p className="text-xs text-muted-foreground" data-testid={`text-customer-phone-${customer.id}`}>
                              {customer.phone}
                            </p>
                          )}
                          {customer.email && (
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3" data-testid={`text-customer-status-${customer.id}`}>
                        <Badge
                          variant="secondary"
                          className={`rounded-full text-xs font-semibold no-default-hover-elevate no-default-active-elevate ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-3" data-testid={`text-customer-orders-${customer.id}`}>
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{customer.totalOrders || 0}</span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap font-medium" data-testid={`text-customer-spent-${customer.id}`}>
                        {formatPrice(customer.totalSpent || 0)}
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground" data-testid={`text-customer-first-order-${customer.id}`}>
                        {formatDate(customer.firstOrderAt)}
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground" data-testid={`text-customer-last-order-${customer.id}`}>
                        {formatDate(customer.lastOrderAt)}
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-muted-foreground truncate max-w-[150px] block" data-testid={`text-customer-notes-${customer.id}`}>
                          {customer.notes || "—"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditCustomer(customer)}
                            data-testid={`button-edit-customer-${customer.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Удалить клиента?")) {
                                deleteMutation.mutate(customer.id);
                              }
                            }}
                            data-testid={`button-delete-customer-${customer.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground">
        <span data-testid="text-customers-count">Показано {filteredCustomers.length} из {customers.length}</span>
      </div>

      <Dialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать клиента</DialogTitle>
          </DialogHeader>
          {editCustomer && (
            <CustomerForm
              initialData={editCustomer}
              onSubmit={(data) => updateMutation.mutate({ id: editCustomer.id, data })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerForm({
  initialData,
  onSubmit,
  isPending,
}: {
  initialData?: { name: string; phone?: string | null; email?: string | null; notes?: string | null };
  onSubmit: (data: { name: string; phone?: string; email?: string; notes?: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Имя *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя клиента"
          required
          data-testid="input-customer-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Телефон</Label>
        <PhoneInput
          value={phone}
          onValueChange={setPhone}
          data-testid="input-customer-phone"
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          data-testid="input-customer-email"
        />
      </div>
      <div className="space-y-2">
        <Label>Заметки</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Заметки о клиенте..."
          className="resize-none"
          data-testid="input-customer-notes"
        />
      </div>
      <Button type="submit" disabled={isPending || !name.trim()} className="w-full" data-testid="button-submit-customer">
        {isPending ? "Сохранение..." : initialData ? "Сохранить" : "Добавить"}
      </Button>
    </form>
  );
}
