import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import StorefrontPage from "@/pages/storefront";
import InvoicePage from "@/pages/invoice";
import AdminLayout from "@/pages/admin/admin-layout";
import Dashboard from "@/pages/admin/dashboard";
import ProductsPage from "@/pages/admin/products";
import CategoriesPage from "@/pages/admin/categories";
import BrandingPage from "@/pages/admin/branding";
import WhatsAppPage from "@/pages/admin/whatsapp";

import StoreSettingsPage from "@/pages/admin/store-settings";
import OrdersPage from "@/pages/admin/orders";
import CustomersPage from "@/pages/admin/customers";
import AnalyticsPage from "@/pages/admin/analytics";
import SuperAdminLayout from "@/pages/superadmin/superadmin-layout";
import SuperAdminDashboard from "@/pages/superadmin/dashboard";
import SuperAdminStores from "@/pages/superadmin/stores";
import SuperAdminStoreDetail from "@/pages/superadmin/store-detail";
import SuperAdminOrders from "@/pages/superadmin/orders";
import SuperAdminUsers from "@/pages/superadmin/users";
import SuperAdminEvents from "@/pages/superadmin/events";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function SuperAdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <SuperAdminLayout>
      <Component />
    </SuperAdminLayout>
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
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/admin" component={() => <AdminRoute component={Dashboard} />} />
      <Route path="/admin/products" component={() => <AdminRoute component={ProductsPage} />} />
      <Route path="/admin/categories" component={() => <AdminRoute component={CategoriesPage} />} />
      <Route path="/admin/branding" component={() => <AdminRoute component={BrandingPage} />} />
      <Route path="/admin/whatsapp" component={() => <AdminRoute component={WhatsAppPage} />} />

      <Route path="/admin/orders" component={() => <AdminRoute component={OrdersPage} />} />
      <Route path="/admin/customers" component={() => <AdminRoute component={CustomersPage} />} />
      <Route path="/admin/analytics" component={() => <AdminRoute component={AnalyticsPage} />} />
      <Route path="/admin/settings" component={() => <AdminRoute component={StoreSettingsPage} />} />
      <Route path="/superadmin" component={() => <SuperAdminRoute component={SuperAdminDashboard} />} />
      <Route path="/superadmin/stores/:id" component={() => <SuperAdminRoute component={SuperAdminStoreDetail} />} />
      <Route path="/superadmin/stores" component={() => <SuperAdminRoute component={SuperAdminStores} />} />
      <Route path="/superadmin/orders" component={() => <SuperAdminRoute component={SuperAdminOrders} />} />
      <Route path="/superadmin/users" component={() => <SuperAdminRoute component={SuperAdminUsers} />} />
      <Route path="/superadmin/events" component={() => <SuperAdminRoute component={SuperAdminEvents} />} />
      <Route path="/s/:slug" component={StorefrontPage} />
      <Route path="/invoice/:id" component={InvoicePage} />
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
