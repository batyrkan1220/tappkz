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
import { LayoutDashboard, Package, FolderOpen, Palette, MessageCircle, Settings, ClipboardList, Users, BarChart3, Crown, Truck } from "lucide-react";

function PageBreadcrumb({ store }: { store: Store }) {
  const [location] = useLocation();
  const labels = getBusinessLabels(store?.businessType);

  const pages: Record<string, { title: string; icon: typeof LayoutDashboard }> = {
    "/admin": { title: "Панель управления", icon: LayoutDashboard },
    "/admin/analytics": { title: "Аналитика", icon: BarChart3 },
    "/admin/orders": { title: "Заказы", icon: ClipboardList },
    "/admin/customers": { title: "Клиенты", icon: Users },
    "/admin/products": { title: labels.itemLabelPlural, icon: Package },
    "/admin/categories": { title: "Категории", icon: FolderOpen },
    "/admin/branding": { title: "Брендирование", icon: Palette },
    "/admin/delivery": { title: "Доставка", icon: Truck },
    "/admin/whatsapp": { title: "WhatsApp", icon: MessageCircle },
    "/admin/subscription": { title: "Подписка", icon: Crown },
    "/admin/settings": { title: "Настройки", icon: Settings },
  };

  const page = pages[location];
  if (!page) return null;
  const Icon = page.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
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
