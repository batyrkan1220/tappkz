import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import StorefrontPage from "@/pages/storefront";
import AdminLayout from "@/pages/admin/admin-layout";
import Dashboard from "@/pages/admin/dashboard";
import ProductsPage from "@/pages/admin/products";
import CategoriesPage from "@/pages/admin/categories";
import BrandingPage from "@/pages/admin/branding";
import WhatsAppPage from "@/pages/admin/whatsapp";
import KaspiPage from "@/pages/admin/kaspi";
import StoreSettingsPage from "@/pages/admin/store-settings";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) {
    return <AdminRoute component={Dashboard} />;
  }
  return <LandingPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/admin" component={() => <AdminRoute component={Dashboard} />} />
      <Route path="/admin/products" component={() => <AdminRoute component={ProductsPage} />} />
      <Route path="/admin/categories" component={() => <AdminRoute component={CategoriesPage} />} />
      <Route path="/admin/branding" component={() => <AdminRoute component={BrandingPage} />} />
      <Route path="/admin/whatsapp" component={() => <AdminRoute component={WhatsAppPage} />} />
      <Route path="/admin/kaspi" component={() => <AdminRoute component={KaspiPage} />} />
      <Route path="/admin/settings" component={() => <AdminRoute component={StoreSettingsPage} />} />
      <Route path="/s/:slug" component={StorefrontPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
