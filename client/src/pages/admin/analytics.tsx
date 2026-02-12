import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, CircleDollarSign, ClipboardList } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DateRangePicker } from "@/components/date-range-picker";
import type { DateRange } from "react-day-picker";

type AnalyticsData = {
  dailyVisits: { date: string; count: number }[];
  dailySales: { date: string; total: number }[];
  dailyOrders: { date: string; count: number }[];
  totalVisits: number;
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  newCustomers: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  ordersByPayment: { method: string; count: number }[];
  customersByOrders: { name: string; phone: string | null; orders: number; spent: number }[];
};

const TABS = [
  { key: "traffic", label: "Трафик" },
  { key: "orders", label: "Заказы" },
  { key: "customers", label: "Клиенты" },
  { key: "products", label: "Товары" },
];

function formatPrice(amount: number) {
  return new Intl.NumberFormat("ru-KZ").format(amount) + " ₸";
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function fillDailyData<T extends { date: string }>(
  data: T[],
  defaultVal: Omit<T, "date">,
  from: Date,
  to: Date
): (T & { dateLabel: string })[] {
  const map = new Map<string, T>();
  for (const d of data) {
    const key = new Date(d.date).toISOString().slice(0, 10);
    map.set(key, d);
  }
  const result: (T & { dateLabel: string })[] = [];
  const current = new Date(from);
  while (current <= to) {
    const key = current.toISOString().slice(0, 10);
    const existing = map.get(key);
    result.push({
      ...(existing || { date: key, ...defaultVal } as T),
      dateLabel: formatDateShort(key),
    });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

function getDefaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function MiniChart({
  title,
  value,
  icon: Icon,
  data,
  dataKey,
  formatValue,
}: {
  title: string;
  value: string;
  icon: typeof Eye;
  data: any[];
  dataKey: string;
  formatValue?: (v: number) => string;
}) {
  return (
    <Card className="p-4 flex-1 min-w-[280px]" data-testid={`card-chart-${title}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold tracking-tight mb-3" data-testid={`text-total-${title}`}>{value}</p>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(val: number) => [formatValue ? formatValue(val) : val, title]}
              labelFormatter={(label) => label}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("traffic");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);

  const queryParams = useMemo(() => {
    if (!dateRange.from) return "";
    const from = dateRange.from.toISOString().slice(0, 10);
    const to = (dateRange.to || dateRange.from).toISOString().slice(0, 10);
    return `?startDate=${from}&endDate=${to}`;
  }, [dateRange]);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: [`/api/my-store/analytics/detailed${queryParams}`],
  });

  const rangeFrom = dateRange.from || new Date();
  const rangeTo = dateRange.to || rangeFrom;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 flex-wrap">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52 flex-1 min-w-[280px]" />)}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!analytics) return null;

  const visitsData = fillDailyData(analytics.dailyVisits, { count: 0 }, rangeFrom, rangeTo);
  const salesData = fillDailyData(analytics.dailySales, { total: 0 }, rangeFrom, rangeTo);
  const ordersData = fillDailyData(analytics.dailyOrders, { count: 0 }, rangeFrom, rangeTo);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold" data-testid="text-analytics-title">Аналитика</h1>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <MiniChart
          title="Page views"
          value={String(analytics.totalVisits)}
          icon={Eye}
          data={visitsData}
          dataKey="count"
        />
        <MiniChart
          title="Sales"
          value={formatPrice(analytics.totalSales)}
          icon={CircleDollarSign}
          data={salesData}
          dataKey="total"
          formatValue={(v) => formatPrice(v)}
        />
        <MiniChart
          title="Orders"
          value={String(analytics.totalOrders)}
          icon={ClipboardList}
          data={ordersData}
          dataKey="count"
        />
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors
                ${activeTab === tab.key
                  ? "bg-background border-b-2 border-foreground"
                  : "bg-muted/30 text-muted-foreground"
                }`}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-sm font-semibold" data-testid="text-report-title">Отчёт</h2>
        {activeTab === "traffic" && <TrafficReport analytics={analytics} />}
        {activeTab === "orders" && <OrdersReport analytics={analytics} />}
        {activeTab === "customers" && <CustomersReport analytics={analytics} />}
        {activeTab === "products" && <ProductsReport analytics={analytics} />}
      </div>
    </div>
  );
}

function ReportRow({ label, value, testId }: { label: string; value?: string; testId?: string }) {
  return (
    <div className="flex items-center justify-between py-3 px-1 border-b last:border-b-0" data-testid={testId}>
      <span className="text-sm">{label}</span>
      {value && <span className="text-sm font-medium text-muted-foreground">{value}</span>}
    </div>
  );
}

function TrafficReport({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="border rounded-md divide-y" data-testid="report-traffic">
      <ReportRow label="Просмотры страниц" value={String(analytics.totalVisits)} testId="report-row-pageviews" />
      <ReportRow label="Визиты" value={String(analytics.totalVisits)} testId="report-row-visits" />
      <ReportRow label="Главные рефералы" testId="report-row-referrals" />
    </div>
  );
}

function OrdersReport({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="border rounded-md divide-y" data-testid="report-orders">
      <ReportRow label="Заказы по времени" value={String(analytics.totalOrders)} testId="report-row-orders-time" />
      <ReportRow label="Продажи по времени" value={formatPrice(analytics.totalSales)} testId="report-row-sales-time" />
      <ReportRow label="Средняя стоимость заказа" value={analytics.totalOrders > 0 ? formatPrice(Math.round(analytics.totalSales / analytics.totalOrders)) : "0 ₸"} testId="report-row-avg-order" />
      <ReportRow label="Способы оплаты по заказам" testId="report-row-payment-methods" />
      {analytics.ordersByPayment.map((p) => (
        <div key={p.method} className="flex items-center justify-between py-2 px-4 text-xs text-muted-foreground">
          <span>{p.method === "kaspi" ? "Kaspi" : p.method === "whatsapp" ? "WhatsApp" : p.method}</span>
          <span>{p.count}</span>
        </div>
      ))}
    </div>
  );
}

function CustomersReport({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="border rounded-md divide-y" data-testid="report-customers">
      <ReportRow label="Клиенты по заказам" value={String(analytics.totalCustomers)} testId="report-row-customers-orders" />
      <ReportRow label="Новые клиенты по датам" value={String(analytics.newCustomers)} testId="report-row-new-customers" />
      {analytics.customersByOrders.length > 0 && (
        <>
          <div className="py-2 px-1 text-xs font-medium text-muted-foreground">Топ клиенты</div>
          {analytics.customersByOrders.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-4 text-xs">
              <div>
                <span className="font-medium">{c.name}</span>
                {c.phone && <span className="ml-2 text-muted-foreground">{c.phone}</span>}
              </div>
              <div className="text-muted-foreground">
                {c.orders} заказов, {formatPrice(c.spent)}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ProductsReport({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="border rounded-md divide-y" data-testid="report-products">
      <ReportRow label="Товары по заказам" testId="report-row-products-orders" />
      {analytics.topProducts.length > 0 ? (
        analytics.topProducts.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-2 px-4 text-xs">
            <span className="font-medium">{p.name}</span>
            <div className="text-muted-foreground">
              {p.quantity} шт, {formatPrice(p.revenue)}
            </div>
          </div>
        ))
      ) : (
        <div className="py-3 px-4 text-xs text-muted-foreground">Нет данных о заказах</div>
      )}
      <ReportRow label="Категории товаров по заказам" testId="report-row-categories-orders" />
    </div>
  );
}
