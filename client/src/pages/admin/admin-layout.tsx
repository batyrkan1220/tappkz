import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import CreateStorePage from "./create-store";
import { getQueryFn } from "@/lib/queryClient";
import type { Store } from "@shared/schema";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
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
          <header className="flex h-12 shrink-0 items-center flex-wrap gap-2 border-b bg-white/50 dark:bg-background/50 backdrop-blur-sm px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-y-auto bg-muted/20 dark:bg-muted/5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
