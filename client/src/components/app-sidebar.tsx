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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, FolderOpen, Palette, MessageCircle, Settings, LogOut, ExternalLink, ShoppingBag, ClipboardList, Users, BarChart3, Shield, Crown, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { getBusinessLabels, type Store, type Order } from "@shared/schema";

export function AppSidebar({ store }: { store?: Store | null }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const labels = getBusinessLabels(store?.businessType);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/my-store/orders"],
    refetchInterval: 15000,
    enabled: !!store,
  });

  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.paymentStatus === "unpaid" || o.fulfillmentStatus === "unfulfilled"
  ).length;

  const menuItems = [
    { title: "Панель", url: "/admin", icon: LayoutDashboard },
    { title: "Аналитика", url: "/admin/analytics", icon: BarChart3 },
    { title: "Заказы", url: "/admin/orders", icon: ClipboardList, badge: pendingCount },
    { title: "Клиенты", url: "/admin/customers", icon: Users },
    { title: labels.itemLabelPlural, url: "/admin/products", icon: Package },
    { title: "Категории", url: "/admin/categories", icon: FolderOpen },
    { title: "Брендирование", url: "/admin/branding", icon: Palette },
    { title: "WhatsApp", url: "/admin/whatsapp", icon: MessageCircle },
    { title: "Inbox", url: "/admin/inbox", icon: Inbox },
    { title: "Подписка", url: "/admin/subscription", icon: Crown },
    { title: "Настройки", url: "/admin/settings", icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/admin" data-testid="link-sidebar-home">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <ShoppingBag className="h-4 w-4 text-background" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold tracking-tight" data-testid="text-sidebar-brand">TakeSale</p>
              {store && (
                <p className="truncate text-xs text-muted-foreground" data-testid="text-sidebar-store-name">{store.name}</p>
              )}
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Управление</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-sidebar-${item.title}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium flex-1">{item.title}</span>
                      {"badge" in item && (item as any).badge > 0 && (
                        <Badge variant="secondary" className="ml-auto rounded-full text-[10px] px-1.5 py-0 min-w-[20px] text-center font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate no-default-active-elevate" data-testid="badge-sidebar-orders-count">
                          {(item as any).badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user?.isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Администрирование</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-testid="link-sidebar-superadmin">
                    <Link href="/superadmin">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">SuperAdmin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {store && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Магазин</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-testid="link-sidebar-storefront">
                    <a href={`/s/${store.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      <span className="font-medium">Открыть магазин</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" data-testid="text-sidebar-user">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email || "Пользователь"}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
