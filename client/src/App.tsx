import { Switch, Route, Redirect } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
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
const StoreSettingsPage = lazy(() => import("@/pages/admin/store-settings"));
const SubscriptionPage = lazy(() => import("@/pages/admin/subscription"));
const OrdersPage = lazy(() => import("@/pages/admin/orders"));
const CustomersPage = lazy(() => import("@/pages/admin/customers"));
const AnalyticsPage = lazy(() => import("@/pages/admin/analytics"));
const DeliveryPage = lazy(() => import("@/pages/admin/delivery"));
const ProductFormPage = lazy(() => import("@/pages/admin/product-form"));
const DiscountsPage = lazy(() => import("@/pages/admin/discounts"));
const DiscountFormPage = lazy(() => import("@/pages/admin/discount-form"));
const GuidePage = lazy(() => import("@/pages/admin/guide"));
const SuperAdminDashboard = lazy(() => import("@/pages/superadmin/dashboard"));
const SuperAdminStores = lazy(() => import("@/pages/superadmin/stores"));
const SuperAdminStoreDetail = lazy(() => import("@/pages/superadmin/store-detail"));
const SuperAdminOrders = lazy(() => import("@/pages/superadmin/orders"));
const SuperAdminUsers = lazy(() => import("@/pages/superadmin/users"));
const SuperAdminEvents = lazy(() => import("@/pages/superadmin/events"));
const SuperAdminTariffs = lazy(() => import("@/pages/superadmin/tariffs"));
const SuperAdminWhatsApp = lazy(() => import("@/pages/superadmin/whatsapp"));
const SuperAdminTrackingPixels = lazy(() => import("@/pages/superadmin/tracking-pixels"));
const SuperAdminEmail = lazy(() => import("@/pages/superadmin/email"));

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
  const { data: store, isLoading: storeLoading } = useQuery<any>({
    queryKey: ["/api/my-store"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });

  if (isLoading) return null;

  if (isAuthenticated) {
    if (storeLoading) return null;
    if (store) {
      return <AdminRoute component={Dashboard} />;
    }
    return <Redirect to="/admin" />;
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
      <Route path="/admin/products/:id" component={() => <AdminRoute component={ProductFormPage} />} />
      <Route path="/admin/categories" component={() => <AdminRoute component={CategoriesPage} />} />
      <Route path="/admin/branding" component={() => <AdminRoute component={BrandingPage} />} />


      <Route path="/admin/discounts/new" component={() => <AdminRoute component={DiscountFormPage} />} />
      <Route path="/admin/discounts/:id" component={() => <AdminRoute component={DiscountFormPage} />} />
      <Route path="/admin/discounts" component={() => <AdminRoute component={DiscountsPage} />} />
      <Route path="/admin/orders" component={() => <AdminRoute component={OrdersPage} />} />
      <Route path="/admin/customers" component={() => <AdminRoute component={CustomersPage} />} />
      <Route path="/admin/analytics" component={() => <AdminRoute component={AnalyticsPage} />} />
      <Route path="/admin/delivery" component={() => <AdminRoute component={DeliveryPage} />} />
      <Route path="/admin/settings" component={() => <AdminRoute component={StoreSettingsPage} />} />
      <Route path="/admin/subscription" component={() => <AdminRoute component={SubscriptionPage} />} />
      <Route path="/admin/guide" component={() => <AdminRoute component={GuidePage} />} />
      <Route path="/superadmin" component={() => <SuperAdminRoute component={SuperAdminDashboard} />} />
      <Route path="/superadmin/stores/:id" component={() => <SuperAdminRoute component={SuperAdminStoreDetail} />} />
      <Route path="/superadmin/stores" component={() => <SuperAdminRoute component={SuperAdminStores} />} />
      <Route path="/superadmin/orders" component={() => <SuperAdminRoute component={SuperAdminOrders} />} />
      <Route path="/superadmin/users" component={() => <SuperAdminRoute component={SuperAdminUsers} />} />
      <Route path="/superadmin/events" component={() => <SuperAdminRoute component={SuperAdminEvents} />} />
      <Route path="/superadmin/tariffs" component={() => <SuperAdminRoute component={SuperAdminTariffs} />} />
      <Route path="/superadmin/whatsapp" component={() => <SuperAdminRoute component={SuperAdminWhatsApp} />} />
      <Route path="/superadmin/tracking" component={() => <SuperAdminRoute component={SuperAdminTrackingPixels} />} />
      <Route path="/superadmin/email" component={() => <SuperAdminRoute component={SuperAdminEmail} />} />
      <Route path="/invoice/:slug/:orderNumber" component={InvoicePage} />
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
