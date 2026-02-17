import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import CreateStorePage from "./create-store";
import { getQueryFn } from "@/lib/queryClient";
import { getBusinessLabels, type Store } from "@shared/schema";
import { usePlatformPixels } from "@/hooks/use-platform-pixels";
import { useLocation } from "wouter";
import { LayoutDashboard, Package, FolderOpen, Palette, Settings, ClipboardList, Users, BarChart3, Crown, Truck, Percent, Globe, Eye, Megaphone, ShoppingCart, Search, Activity, Store as StoreIcon } from "lucide-react";

function PageBreadcrumb({ store }: { store: Store }) {
  const [location] = useLocation();
  const labels = getBusinessLabels(store?.businessType);

  const pages: Record<string, { title: string; group: string; icon: typeof LayoutDashboard }> = {
    "/admin": { title: "Панель", group: "Главное", icon: LayoutDashboard },
    "/admin/orders": { title: "Заказы", group: "Главное", icon: ClipboardList },
    "/admin/products": { title: labels.itemLabelPlural, group: "Каталог", icon: Package },
    "/admin/categories": { title: "Категории", group: "Каталог", icon: FolderOpen },
    "/admin/discounts": { title: "Скидки", group: "Каталог", icon: Percent },
    "/admin/customers": { title: "Клиенты", group: "Клиенты", icon: Users },
    "/admin/analytics": { title: "Аналитика", group: "Клиенты", icon: BarChart3 },
    "/admin/branding": { title: "Оформление", group: "Магазин", icon: Palette },
    "/admin/delivery": { title: "Доставка", group: "Настройки", icon: Truck },
    "/admin/subscription": { title: "Подписка", group: "Настройки", icon: Crown },
  };

  const settingsTabs: Record<string, { title: string; group: string; icon: typeof LayoutDashboard }> = {
    "store-info": { title: "Общее", group: "Магазин", icon: StoreIcon },
    "contacts": { title: "Контакты", group: "Настройки", icon: Globe },
    "storefront": { title: "Витрина", group: "Магазин", icon: Eye },
    "announcement": { title: "Объявление", group: "Магазин", icon: Megaphone },
    "checkout": { title: "Оформление заказа", group: "Магазин", icon: ShoppingCart },
    "seo": { title: "SEO", group: "Настройки", icon: Search },
    "pixels": { title: "Пиксели", group: "Настройки", icon: Activity },
  };

  let page = pages[location];
  if (!page) {
    const prefix = Object.keys(pages).find((key) => key !== "/admin" && location.startsWith(key));
    if (prefix) page = pages[prefix];
  }

  if (!page && location.startsWith("/admin/settings")) {
    const tab = new URLSearchParams(window.location.search).get("tab") || "store-info";
    const tabInfo = settingsTabs[tab] || settingsTabs["store-info"];
    page = { title: tabInfo.title, group: tabInfo.group, icon: tabInfo.icon };
  }

  if (!page) return null;
  const Icon = page.icon;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground/60" data-testid="text-breadcrumb-group">{page.group}</span>
      <span className="text-muted-foreground/40">/</span>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium text-muted-foreground" data-testid="text-breadcrumb">{page.title}</span>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  usePlatformPixels();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  const { data: store, isLoading: storeLoading } = useQuery<Store | null>({
    queryKey: ["/api/my-store"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });

  if (authLoading || storeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!store) {
    return <CreateStorePage />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar store={store} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center flex-wrap gap-3 border-b bg-white/50 dark:bg-background/50 backdrop-blur-sm px-4 sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="h-4 w-px bg-border" />
            <PageBreadcrumb store={store} />
          </header>
          <main className="flex-1 overflow-y-auto bg-muted/20 dark:bg-muted/5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
