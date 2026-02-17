import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Palette,
  LogOut,
  ExternalLink,
  ClipboardList,
  Users,
  BarChart3,
  Shield,
  Crown,
  Truck,
  Percent,
  Store,
  Globe,
  Eye,
  Megaphone,
  ShoppingCart,
  Search,
  Activity,
  ChevronRight,
} from "lucide-react";
import { TappLogo } from "@/components/tapp-logo";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { getBusinessLabels, type Store as StoreType, type Order } from "@shared/schema";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badge?: number | string;
  badgeVariant?: "count" | "label";
  external?: boolean;
};

export function AppSidebar({ store }: { store?: StoreType | null }) {
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

  const mainItems: NavItem[] = [
    { title: "Панель", url: "/admin", icon: LayoutDashboard },
    { title: "Заказы", url: "/admin/orders", icon: ClipboardList, badge: pendingCount, badgeVariant: "count" },
  ];

  const catalogItems: NavItem[] = [
    { title: labels.itemLabelPlural, url: "/admin/products", icon: Package },
    { title: "Категории", url: "/admin/categories", icon: FolderOpen },
    { title: "Скидки", url: "/admin/discounts", icon: Percent },
  ];

  const clientItems: NavItem[] = [
    { title: "Клиенты", url: "/admin/customers", icon: Users },
    { title: "Аналитика", url: "/admin/analytics", icon: BarChart3 },
  ];

  const storeSubItems: NavItem[] = [
    { title: "Общее", url: "/admin/settings?tab=store-info", icon: Store },
    { title: "Контакты", url: "/admin/settings?tab=contacts", icon: Globe },
    { title: "Витрина", url: "/admin/settings?tab=storefront", icon: Eye },
    { title: "Объявление", url: "/admin/settings?tab=announcement", icon: Megaphone },
    { title: "Оформление заказа", url: "/admin/settings?tab=checkout", icon: ShoppingCart },
    { title: "Дизайн магазина", url: "/admin/branding", icon: Palette },
  ];

  const settingsItems: NavItem[] = [
    { title: "Доставка", url: "/admin/delivery", icon: Truck },
    { title: "SEO и аналитика", url: "/admin/settings?tab=seo", icon: Search },
    { title: "Подписка", url: "/admin/subscription", icon: Crown, badge: store?.plan?.toUpperCase(), badgeVariant: "label" },
  ];

  const isActive = (url: string) => {
    if (url === "/admin") return location === "/admin";
    if (url.includes("?tab=")) {
      const [path, query] = url.split("?");
      const tab = new URLSearchParams(query).get("tab");
      const currentSearch = window.location.search;
      const currentTab = new URLSearchParams(currentSearch).get("tab");
      if (location.startsWith(path)) {
        if (currentTab) return currentTab === tab;
        return tab === "store-info";
      }
      return false;
    }
    return location.startsWith(url);
  };

  const isStoreSubActive = storeSubItems.some(item => isActive(item.url));

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title + item.url}>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        data-testid={`link-sidebar-${item.url.replace("/admin/", "").replace("/admin", "dashboard").replace("?tab=", "-")}`}
      >
        {item.external ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
          </a>
        ) : (
          <Link href={item.url}>
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
            {item.badge !== undefined && item.badgeVariant === "count" && Number(item.badge) > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto rounded-full text-[10px] px-1.5 py-0 min-w-[20px] text-center font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate no-default-active-elevate"
                data-testid="badge-sidebar-orders-count"
              >
                {item.badge}
              </Badge>
            )}
            {item.badge !== undefined && item.badgeVariant === "label" && (
              <Badge
                variant="secondary"
                className="ml-auto text-[10px] no-default-hover-elevate no-default-active-elevate"
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(renderItem)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-3 pb-2">
        <Link href="/admin" data-testid="link-sidebar-home">
          <div className="flex items-center gap-2.5 px-1">
            <TappLogo size={28} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold tracking-tight" data-testid="text-sidebar-brand">Tapp</p>
              {store && (
                <p className="truncate text-[11px] text-muted-foreground leading-tight" data-testid="text-sidebar-store-name">{store.name}</p>
              )}
            </div>
          </div>
        </Link>
        {store && (
          <a
            href={`/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover-elevate"
            data-testid="link-sidebar-storefront"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Открыть витрину</span>
          </a>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {renderGroup("Главное", mainItems)}
        {renderGroup("Каталог", catalogItems)}
        {renderGroup("Клиенты", clientItems)}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Настройки
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen={isStoreSubActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isStoreSubActive}
                      data-testid="link-sidebar-store-menu"
                    >
                      <Store className="h-4 w-4" />
                      <span className="flex-1">Магазин</span>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {storeSubItems.map((item) => (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(item.url)}
                            data-testid={`link-sidebar-${item.url.replace("/admin/", "").replace("/admin", "dashboard").replace("?tab=", "-")}`}
                          >
                            <Link href={item.url}>
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              {settingsItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.isSuperAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Платформа
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/superadmin")} data-testid="link-sidebar-superadmin">
                      <Link href="/superadmin">
                        <Shield className="h-4 w-4" />
                        <span className="flex-1">SuperAdmin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold" data-testid="text-sidebar-user">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email || "Пользователь"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground leading-tight">{user?.email}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
