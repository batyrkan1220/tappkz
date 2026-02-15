import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/pages/admin/admin-layout";
import SuperAdminLayout from "@/pages/superadmin/superadmin-layout";

const NotFound = lazy(() => import("@/pages/not-found"));
const LandingPage = lazy(() => import("@/pages/landing"));
const LoginPage = lazy(() => import("@/pages/auth/login"));
const RegisterPage = lazy(() => import("@/pages/auth/register"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"));
const StorefrontPage = lazy(() => import("@/pages/storefront"));
const InvoicePage = lazy(() => import("@/pages/invoice"));
const Dashboard = lazy(() => import("@/pages/admin/dashboard"));
const ProductsPage = lazy(() => import("@/pages/admin/products"));
const CategoriesPage = lazy(() => import("@/pages/admin/categories"));
const BrandingPage = lazy(() => import("@/pages/admin/branding"));
const WhatsAppPage = lazy(() => import("@/pages/admin/whatsapp"));
const StoreSettingsPage = lazy(() => import("@/pages/admin/store-settings"));
const SubscriptionPage = lazy(() => import("@/pages/admin/subscription"));
const OrdersPage = lazy(() => import("@/pages/admin/orders"));
const CustomersPage = lazy(() => import("@/pages/admin/customers"));
const AnalyticsPage = lazy(() => import("@/pages/admin/analytics"));
const SuperAdminDashboard = lazy(() => import("@/pages/superadmin/dashboard"));
const SuperAdminStores = lazy(() => import("@/pages/superadmin/stores"));
const SuperAdminStoreDetail = lazy(() => import("@/pages/superadmin/store-detail"));
const SuperAdminOrders = lazy(() => import("@/pages/superadmin/orders"));
const SuperAdminUsers = lazy(() => import("@/pages/superadmin/users"));
const SuperAdminEvents = lazy(() => import("@/pages/superadmin/events"));
const SuperAdminTariffs = lazy(() => import("@/pages/superadmin/tariffs"));
const SuperAdminWhatsApp = lazy(() => import("@/pages/superadmin/whatsapp"));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center" data-testid="page-loader">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </AdminLayout>
  );
}

function SuperAdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <SuperAdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
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
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/admin" component={() => <AdminRoute component={Dashboard} />} />
      <Route path="/admin/products" component={() => <AdminRoute component={ProductsPage} />} />
      <Route path="/admin/categories" component={() => <AdminRoute component={CategoriesPage} />} />
      <Route path="/admin/branding" component={() => <AdminRoute component={BrandingPage} />} />
      <Route path="/admin/whatsapp" component={() => <AdminRoute component={WhatsAppPage} />} />


      <Route path="/admin/orders" component={() => <AdminRoute component={OrdersPage} />} />
      <Route path="/admin/customers" component={() => <AdminRoute component={CustomersPage} />} />
      <Route path="/admin/analytics" component={() => <AdminRoute component={AnalyticsPage} />} />
      <Route path="/admin/settings" component={() => <AdminRoute component={StoreSettingsPage} />} />
      <Route path="/admin/subscription" component={() => <AdminRoute component={SubscriptionPage} />} />
      <Route path="/superadmin" component={() => <SuperAdminRoute component={SuperAdminDashboard} />} />
      <Route path="/superadmin/stores/:id" component={() => <SuperAdminRoute component={SuperAdminStoreDetail} />} />
      <Route path="/superadmin/stores" component={() => <SuperAdminRoute component={SuperAdminStores} />} />
      <Route path="/superadmin/orders" component={() => <SuperAdminRoute component={SuperAdminOrders} />} />
      <Route path="/superadmin/users" component={() => <SuperAdminRoute component={SuperAdminUsers} />} />
      <Route path="/superadmin/events" component={() => <SuperAdminRoute component={SuperAdminEvents} />} />
      <Route path="/superadmin/tariffs" component={() => <SuperAdminRoute component={SuperAdminTariffs} />} />
      <Route path="/superadmin/whatsapp" component={() => <SuperAdminRoute component={SuperAdminWhatsApp} />} />
      <Route path="/invoice/:id" component={InvoicePage} />
      <Route path="/:slug" component={StorefrontPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<PageLoader />}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
