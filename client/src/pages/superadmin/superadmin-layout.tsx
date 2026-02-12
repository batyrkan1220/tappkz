import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Store, Users, LogOut, Shield, ArrowLeft } from "lucide-react";
import { useLocation, Link } from "wouter";

function SuperAdminSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const menuItems = [
    { title: "Дашборд", url: "/superadmin", icon: LayoutDashboard },
    { title: "Магазины", url: "/superadmin/stores", icon: Store },
    { title: "Пользователи", url: "/superadmin/users", icon: Users },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold tracking-tight" data-testid="text-superadmin-brand">SuperAdmin</p>
            <p className="truncate text-xs text-muted-foreground">TakeSale</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Платформа</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-superadmin-${item.title}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="link-superadmin-back">
                  <Link href="/admin">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="font-medium">Вернуться в панель</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400">{user?.firstName?.[0] || user?.email?.[0] || "S"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" data-testid="text-superadmin-user">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email || "Admin"}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => logout()} data-testid="button-superadmin-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
    if (!isLoading && isAuthenticated && !user?.isSuperAdmin) {
      window.location.href = "/admin";
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isSuperAdmin) return null;

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <SuperAdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center flex-wrap gap-2 border-b bg-white/50 dark:bg-background/50 backdrop-blur-sm px-4">
            <SidebarTrigger data-testid="button-superadmin-sidebar-toggle" />
            <div className="flex items-center gap-1.5 ml-auto">
              <Shield className="h-3.5 w-3.5 text-red-600" />
              <span className="text-xs font-semibold text-red-600">SuperAdmin</span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-muted/20 dark:bg-muted/5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
