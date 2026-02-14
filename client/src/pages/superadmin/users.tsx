import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shield, ShieldOff, Mail, Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isSuperAdmin: boolean;
  createdAt: string | null;
}

export default function SuperAdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { data: usersList, isLoading } = useQuery<AdminUser[]>({ queryKey: ["/api/superadmin/users"] });

  const toggleSuperAdminMutation = useMutation({
    mutationFn: async ({ id, isSuperAdmin }: { id: string; isSuperAdmin: boolean }) => {
      await apiRequest("PATCH", `/api/superadmin/users/${id}/superadmin`, { isSuperAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      toast({ title: "Роль обновлена" });
    },
    onError: () => toast({ title: "Ошибка обновления", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-superadmin-users-title">Пользователи</h1>
        <p className="mt-1 text-sm text-muted-foreground">Всего: {usersList?.length || 0}</p>
      </div>

      <div className="space-y-3">
        {usersList?.map((u) => {
          const isSelf = u.id === currentUser?.id;
          const displayName = u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : (u.email || "—");
          const initials = u.firstName?.[0] || u.email?.[0] || "U";
          const createdDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString("ru-RU", { timeZone: "Asia/Almaty" }) : "—";

          return (
            <Card key={u.id} className="p-4" data-testid={`card-user-${u.id}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm font-semibold bg-zinc-100 dark:bg-zinc-800">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate" data-testid={`text-user-name-${u.id}`}>{displayName}</p>
                      {u.isSuperAdmin && (
                        <Badge variant="destructive" data-testid={`badge-superadmin-${u.id}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          SuperAdmin
                        </Badge>
                      )}
                      {isSelf && <Badge variant="secondary">Вы</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {u.email || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {createdDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {!isSelf && (
                    <Button
                      variant={u.isSuperAdmin ? "outline" : "default"}
                      onClick={() => toggleSuperAdminMutation.mutate({ id: u.id, isSuperAdmin: !u.isSuperAdmin })}
                      disabled={toggleSuperAdminMutation.isPending}
                      data-testid={`button-toggle-superadmin-${u.id}`}
                    >
                      {u.isSuperAdmin ? (
                        <>
                          <ShieldOff className="h-4 w-4 mr-1.5" />
                          Снять права
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-1.5" />
                          Назначить
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {(!usersList || usersList.length === 0) && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Пользователи не найдены</p>
          </Card>
        )}
      </div>
    </div>
  );
}
