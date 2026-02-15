import {
  stores, storeThemes, storeSettings, categories, products, storeEvents, orders, customers, platformSettings,
  type Store, type InsertStore,
  type StoreTheme, type InsertStoreTheme,
  type StoreSettings, type InsertStoreSettings,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type StoreEvent, type InsertStoreEvent,
  type Order, type InsertOrder,
  type Customer, type InsertCustomer,
  PLAN_LIMITS,
} from "@shared/schema";
import { users, type User } from "@shared/models/auth";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, count, asc } from "drizzle-orm";

export interface IStorage {
  getStoreByOwner(userId: string): Promise<Store | undefined>;
  getStoreBySlug(slug: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, data: Partial<InsertStore>): Promise<Store | undefined>;

  getTheme(storeId: number): Promise<StoreTheme | undefined>;
  upsertTheme(theme: InsertStoreTheme): Promise<StoreTheme>;

  getSettings(storeId: number): Promise<StoreSettings | undefined>;
  upsertSettings(settings: InsertStoreSettings): Promise<StoreSettings>;

  getCategories(storeId: number): Promise<Category[]>;
  createCategory(cat: InsertCategory): Promise<Category>;
  updateCategory(id: number, storeId: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number, storeId: number): Promise<void>;

  getProducts(storeId: number): Promise<Product[]>;
  getProduct(id: number, storeId: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, storeId: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number, storeId: number): Promise<void>;
  countProducts(storeId: number): Promise<number>;
  countOrdersThisMonth(storeId: number): Promise<number>;
  countImages(storeId: number): Promise<number>;

  recordEvent(event: InsertStoreEvent): Promise<void>;
  getAnalytics(storeId: number): Promise<{ visits: number; checkouts: number; addToCarts: number }>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getNextOrderNumber(storeId: number): Promise<number>;
  getOrdersByStore(storeId: number): Promise<Order[]>;
  updateOrder(id: number, storeId: number, data: Partial<InsertOrder>): Promise<Order | undefined>;

  getCustomersByStore(storeId: number): Promise<Customer[]>;
  getCustomer(id: number, storeId: number): Promise<Customer | undefined>;
  createCustomer(data: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, storeId: number, data: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number, storeId: number): Promise<void>;
  upsertCustomerFromOrder(storeId: number, name: string, phone: string, total: number): Promise<Customer>;

  getDetailedAnalytics(storeId: number, startDate?: Date, endDate?: Date): Promise<{
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
  }>;

  getAllStores(): Promise<Store[]>;

  getAllUsers(): Promise<Omit<User, "passwordHash">[]>;
  getAllStoresWithStats(): Promise<(Store & { productsCount: number; ordersCount: number; revenue: number; customersCount: number; ownerEmail: string | null })[]>;
  getPlatformAnalytics(): Promise<{
    totalStores: number;
    activeStores: number;
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalCustomers: number;
    storesByPlan: { plan: string; count: number }[];
    storesByType: { type: string; count: number }[];
    recentStores: Store[];
  }>;
  updateStorePlan(storeId: number, plan: string, planStartedAt?: Date | null, planExpiresAt?: Date | null): Promise<Store | undefined>;
  toggleStoreActive(storeId: number, isActive: boolean): Promise<Store | undefined>;
  setUserSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<void>;

  getPlatformTrends(startDate: Date, endDate: Date): Promise<{
    dailyStores: { date: string; count: number }[];
    dailyOrders: { date: string; count: number }[];
    dailyRevenue: { date: string; total: number }[];
    dailyUsers: { date: string; count: number }[];
  }>;

  getAllOrders(filters?: { search?: string; status?: string; paymentStatus?: string; storeId?: number }): Promise<(Order & { storeName: string; storeSlug: string })[]>;

  getStoreDetail(storeId: number): Promise<{
    store: Store;
    ownerEmail: string | null;
    settings: StoreSettings | null;
    theme: StoreTheme | null;
    productsCount: number;
    ordersCount: number;
    revenue: number;
    customersCount: number;
    recentOrders: Order[];
    recentCustomers: Customer[];
    topProducts: { name: string; quantity: number; revenue: number }[];
  } | null>;

  getPlatformEvents(filters?: { storeId?: number; eventType?: string; limit?: number }): Promise<{ id: number; storeId: number; storeName: string; eventType: string; createdAt: Date | null }[]>;

  getPlatformSetting(key: string): Promise<any | null>;
  setPlatformSetting(key: string, value: any): Promise<void>;
  getAllPlatformSettings(): Promise<{ key: string; value: any }[]>;
}

export class DatabaseStorage implements IStorage {
  async getStoreByOwner(userId: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.ownerUserId, userId));
    return store;
  }

  async getStoreBySlug(slug: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
    return store;
  }

  async createStore(data: InsertStore): Promise<Store> {
    const [store] = await db.insert(stores).values(data).returning();
    await db.insert(storeThemes).values({ storeId: store.id });
    await db.insert(storeSettings).values({ storeId: store.id });
    return store;
  }

  async updateStore(id: number, data: Partial<InsertStore>): Promise<Store | undefined> {
    const [store] = await db.update(stores).set(data).where(eq(stores.id, id)).returning();
    return store;
  }

  async getTheme(storeId: number): Promise<StoreTheme | undefined> {
    const [theme] = await db.select().from(storeThemes).where(eq(storeThemes.storeId, storeId));
    return theme;
  }

  async upsertTheme(data: InsertStoreTheme): Promise<StoreTheme> {
    const existing = await this.getTheme(data.storeId);
    if (existing) {
      const [theme] = await db.update(storeThemes).set(data).where(eq(storeThemes.storeId, data.storeId)).returning();
      return theme;
    }
    const [theme] = await db.insert(storeThemes).values(data).returning();
    return theme;
  }

  async getSettings(storeId: number): Promise<StoreSettings | undefined> {
    const [s] = await db.select().from(storeSettings).where(eq(storeSettings.storeId, storeId));
    return s;
  }

  async upsertSettings(data: InsertStoreSettings): Promise<StoreSettings> {
    const existing = await this.getSettings(data.storeId);
    if (existing) {
      const [s] = await db.update(storeSettings).set(data).where(eq(storeSettings.storeId, data.storeId)).returning();
      return s;
    }
    const [s] = await db.insert(storeSettings).values(data).returning();
    return s;
  }

  async getCategories(storeId: number): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.storeId, storeId)).orderBy(categories.sortOrder);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [cat] = await db.insert(categories).values(data).returning();
    return cat;
  }

  async updateCategory(id: number, storeId: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [cat] = await db.update(categories).set(data).where(and(eq(categories.id, id), eq(categories.storeId, storeId))).returning();
    return cat;
  }

  async deleteCategory(id: number, storeId: number): Promise<void> {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.storeId, storeId)));
  }

  async getProducts(storeId: number): Promise<Product[]> {
    return db.select().from(products).where(eq(products.storeId, storeId)).orderBy(products.sortOrder);
  }

  async getProduct(id: number, storeId: number): Promise<Product | undefined> {
    const [p] = await db.select().from(products).where(and(eq(products.id, id), eq(products.storeId, storeId)));
    return p;
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [p] = await db.insert(products).values(data).returning();
    return p;
  }

  async updateProduct(id: number, storeId: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [p] = await db.update(products).set(data).where(and(eq(products.id, id), eq(products.storeId, storeId))).returning();
    return p;
  }

  async deleteProduct(id: number, storeId: number): Promise<void> {
    await db.delete(products).where(and(eq(products.id, id), eq(products.storeId, storeId)));
  }

  async countProducts(storeId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(products).where(eq(products.storeId, storeId));
    return result?.count ?? 0;
  }

  async countOrdersThisMonth(storeId: number): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [result] = await db.select({ count: count() }).from(orders).where(
      and(eq(orders.storeId, storeId), gte(orders.createdAt, startOfMonth))
    );
    return result?.count ?? 0;
  }

  async countImages(storeId: number): Promise<number> {
    const allProducts = await db.select({ imageUrls: products.imageUrls }).from(products).where(eq(products.storeId, storeId));
    return allProducts.reduce((sum, p) => sum + (p.imageUrls?.length || 0), 0);
  }

  async recordEvent(data: InsertStoreEvent): Promise<void> {
    await db.insert(storeEvents).values(data);
  }

  async getAnalytics(storeId: number): Promise<{ visits: number; checkouts: number; addToCarts: number }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const results = await db
      .select({
        eventType: storeEvents.eventType,
        count: count(),
      })
      .from(storeEvents)
      .where(and(eq(storeEvents.storeId, storeId), gte(storeEvents.createdAt, thirtyDaysAgo)))
      .groupBy(storeEvents.eventType);

    const map: Record<string, number> = {};
    for (const r of results) {
      map[r.eventType] = r.count;
    }
    return {
      visits: map["visit"] ?? 0,
      checkouts: map["checkout_click"] ?? 0,
      addToCarts: map["add_to_cart"] ?? 0,
    };
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getNextOrderNumber(storeId: number): Promise<number> {
    const [result] = await db
      .select({ maxNum: sql<number>`COALESCE(MAX(${orders.orderNumber}), 0)` })
      .from(orders)
      .where(eq(orders.storeId, storeId));
    return (result?.maxNum ?? 0) + 1;
  }

  async getOrdersByStore(storeId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.storeId, storeId)).orderBy(desc(orders.createdAt));
  }

  async updateOrder(id: number, storeId: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders).set(data).where(and(eq(orders.id, id), eq(orders.storeId, storeId))).returning();
    return order;
  }

  async getCustomersByStore(storeId: number): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.storeId, storeId)).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number, storeId: number): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.storeId, storeId)));
    return c;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [c] = await db.insert(customers).values(data).returning();
    return c;
  }

  async updateCustomer(id: number, storeId: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [c] = await db.update(customers).set(data).where(and(eq(customers.id, id), eq(customers.storeId, storeId))).returning();
    return c;
  }

  async deleteCustomer(id: number, storeId: number): Promise<void> {
    await db.delete(customers).where(and(eq(customers.id, id), eq(customers.storeId, storeId)));
  }

  async upsertCustomerFromOrder(storeId: number, name: string, phone: string, total: number): Promise<Customer> {
    const now = new Date();
    const [existing] = await db.select().from(customers).where(and(eq(customers.storeId, storeId), eq(customers.phone, phone)));
    if (existing) {
      const [updated] = await db.update(customers).set({
        name,
        totalOrders: (existing.totalOrders || 0) + 1,
        totalSpent: (existing.totalSpent || 0) + total,
        lastOrderAt: now,
      }).where(eq(customers.id, existing.id)).returning();
      return updated;
    }
    const [c] = await db.insert(customers).values({
      storeId,
      name,
      phone,
      totalOrders: 1,
      totalSpent: total,
      firstOrderAt: now,
      lastOrderAt: now,
    }).returning();
    return c;
  }

  async getDetailedAnalytics(storeId: number, startDate?: Date, endDate?: Date): Promise<{
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
  }> {
    const from = startDate || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
    const to = endDate || new Date();

    const dailyVisitsRaw = await db.execute(sql`
      SELECT DATE(created_at) as day, COUNT(*)::int as cnt
      FROM store_events
      WHERE store_id = ${storeId} AND event_type = 'visit' AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY DATE(created_at) ORDER BY day
    `);
    const dailyVisits = (dailyVisitsRaw.rows as any[]).map(r => ({ date: r.day, count: r.cnt }));

    const dailyOrdersRaw = await db.execute(sql`
      SELECT DATE(created_at) as day, COUNT(*)::int as cnt
      FROM orders
      WHERE store_id = ${storeId} AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY DATE(created_at) ORDER BY day
    `);
    const dailyOrders = (dailyOrdersRaw.rows as any[]).map(r => ({ date: r.day, count: r.cnt }));

    const dailySalesRaw = await db.execute(sql`
      SELECT DATE(created_at) as day, COALESCE(SUM(total), 0)::int as total
      FROM orders
      WHERE store_id = ${storeId} AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY DATE(created_at) ORDER BY day
    `);
    const dailySales = (dailySalesRaw.rows as any[]).map(r => ({ date: r.day, total: r.total }));

    const [visitCount] = await db.select({ count: count() }).from(storeEvents)
      .where(and(eq(storeEvents.storeId, storeId), eq(storeEvents.eventType, "visit"), gte(storeEvents.createdAt, from), lte(storeEvents.createdAt, to)));

    const [orderStats] = await db.execute(sql`
      SELECT COUNT(*)::int as cnt, COALESCE(SUM(total), 0)::int as total_sales
      FROM orders WHERE store_id = ${storeId} AND created_at >= ${from} AND created_at <= ${to}
    `).then(r => r.rows as any[]);

    const [custCount] = await db.select({ count: count() }).from(customers)
      .where(and(eq(customers.storeId, storeId), gte(customers.createdAt, from), lte(customers.createdAt, to)));

    const [newCustCount] = await db.select({ count: count() }).from(customers)
      .where(and(eq(customers.storeId, storeId), gte(customers.createdAt, from), lte(customers.createdAt, to)));

    const topProductsRaw = await db.execute(sql`
      SELECT item->>'name' as name,
             SUM((item->>'quantity')::int)::int as quantity,
             SUM((item->>'price')::int * (item->>'quantity')::int)::int as revenue
      FROM orders, jsonb_array_elements(items) as item
      WHERE store_id = ${storeId} AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY item->>'name' ORDER BY quantity DESC LIMIT 10
    `);
    const topProducts = (topProductsRaw.rows as any[]).map(r => ({ name: r.name, quantity: r.quantity, revenue: r.revenue }));

    const paymentRaw = await db.execute(sql`
      SELECT COALESCE(payment_method, 'whatsapp') as method, COUNT(*)::int as cnt
      FROM orders WHERE store_id = ${storeId} AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY COALESCE(payment_method, 'whatsapp')
    `);
    const ordersByPayment = (paymentRaw.rows as any[]).map(r => ({ method: r.method, count: r.cnt }));

    const topCustomersRaw = await db.select().from(customers)
      .where(eq(customers.storeId, storeId))
      .orderBy(desc(customers.totalOrders))
      .limit(10);
    const customersByOrders = topCustomersRaw.map(c => ({
      name: c.name,
      phone: c.phone,
      orders: c.totalOrders || 0,
      spent: c.totalSpent || 0,
    }));

    return {
      dailyVisits,
      dailySales,
      dailyOrders,
      totalVisits: visitCount?.count ?? 0,
      totalSales: orderStats?.total_sales ?? 0,
      totalOrders: orderStats?.cnt ?? 0,
      totalCustomers: custCount?.count ?? 0,
      newCustomers: newCustCount?.count ?? 0,
      topProducts,
      ordersByPayment,
      customersByOrders,
    };
  }

  async getAllStores(): Promise<Store[]> {
    return db.select().from(stores).orderBy(desc(stores.createdAt));
  }

  async getAllUsers(): Promise<Omit<User, "passwordHash">[]> {
    const rows = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      isSuperAdmin: users.isSuperAdmin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).orderBy(desc(users.createdAt));
    return rows;
  }

  async getAllStoresWithStats(): Promise<(Store & { productsCount: number; ordersCount: number; revenue: number; customersCount: number; ownerEmail: string | null })[]> {
    const allStores = await db.select().from(stores).orderBy(desc(stores.createdAt));
    const result = [];
    for (const store of allStores) {
      const [prodCount] = await db.select({ count: count() }).from(products).where(eq(products.storeId, store.id));
      const [orderStats] = await db.execute(sql`SELECT COUNT(*)::int as cnt, COALESCE(SUM(total), 0)::int as revenue FROM orders WHERE store_id = ${store.id}`).then(r => r.rows as any[]);
      const [custCount] = await db.select({ count: count() }).from(customers).where(eq(customers.storeId, store.id));
      const [owner] = await db.select({ email: users.email }).from(users).where(eq(users.id, store.ownerUserId));
      result.push({
        ...store,
        productsCount: prodCount?.count ?? 0,
        ordersCount: orderStats?.cnt ?? 0,
        revenue: orderStats?.revenue ?? 0,
        customersCount: custCount?.count ?? 0,
        ownerEmail: owner?.email ?? null,
      });
    }
    return result;
  }

  async getPlatformAnalytics() {
    const [storeCount] = await db.select({ count: count() }).from(stores);
    const [activeStoreCount] = await db.select({ count: count() }).from(stores).where(eq(stores.isActive, true));
    const [userCount] = await db.select({ count: count() }).from(users);
    const [orderStats] = await db.execute(sql`SELECT COUNT(*)::int as cnt, COALESCE(SUM(total), 0)::int as revenue FROM orders`).then(r => r.rows as any[]);
    const [prodCount] = await db.select({ count: count() }).from(products);
    const [custCount] = await db.select({ count: count() }).from(customers);

    const planRows = await db.execute(sql`SELECT plan, COUNT(*)::int as cnt FROM stores GROUP BY plan ORDER BY cnt DESC`);
    const storesByPlan = (planRows.rows as any[]).map(r => ({ plan: r.plan, count: r.cnt }));

    const typeRows = await db.execute(sql`SELECT COALESCE(business_type, 'unknown') as btype, COUNT(*)::int as cnt FROM stores GROUP BY COALESCE(business_type, 'unknown') ORDER BY cnt DESC`);
    const storesByType = (typeRows.rows as any[]).map(r => ({ type: r.btype, count: r.cnt }));

    const recentStores = await db.select().from(stores).orderBy(desc(stores.createdAt)).limit(10);

    return {
      totalStores: storeCount?.count ?? 0,
      activeStores: activeStoreCount?.count ?? 0,
      totalUsers: userCount?.count ?? 0,
      totalOrders: orderStats?.cnt ?? 0,
      totalRevenue: orderStats?.revenue ?? 0,
      totalProducts: prodCount?.count ?? 0,
      totalCustomers: custCount?.count ?? 0,
      storesByPlan,
      storesByType,
      recentStores,
    };
  }

  async updateStorePlan(storeId: number, plan: string, planStartedAt?: Date | null, planExpiresAt?: Date | null): Promise<Store | undefined> {
    const updateData: any = { plan };
    if (planStartedAt !== undefined) updateData.planStartedAt = planStartedAt;
    if (planExpiresAt !== undefined) updateData.planExpiresAt = planExpiresAt;
    const [store] = await db.update(stores).set(updateData).where(eq(stores.id, storeId)).returning();
    return store;
  }

  async toggleStoreActive(storeId: number, isActive: boolean): Promise<Store | undefined> {
    const [store] = await db.update(stores).set({ isActive }).where(eq(stores.id, storeId)).returning();
    return store;
  }

  async setUserSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<void> {
    await db.update(users).set({ isSuperAdmin }).where(eq(users.id, userId));
  }

  async getPlatformTrends(startDate: Date, endDate: Date) {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    const dailyStoresRows = await db.execute(
      sql`SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*)::int as cnt FROM stores WHERE created_at >= ${start}::date AND created_at <= ${end}::date + interval '1 day' GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') ORDER BY date`
    );
    const dailyOrdersRows = await db.execute(
      sql`SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*)::int as cnt FROM orders WHERE created_at >= ${start}::date AND created_at <= ${end}::date + interval '1 day' GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') ORDER BY date`
    );
    const dailyRevenueRows = await db.execute(
      sql`SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COALESCE(SUM(total), 0)::int as total FROM orders WHERE created_at >= ${start}::date AND created_at <= ${end}::date + interval '1 day' GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') ORDER BY date`
    );
    const dailyUsersRows = await db.execute(
      sql`SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*)::int as cnt FROM users WHERE created_at >= ${start}::date AND created_at <= ${end}::date + interval '1 day' GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') ORDER BY date`
    );

    return {
      dailyStores: (dailyStoresRows.rows as any[]).map(r => ({ date: r.date, count: r.cnt })),
      dailyOrders: (dailyOrdersRows.rows as any[]).map(r => ({ date: r.date, count: r.cnt })),
      dailyRevenue: (dailyRevenueRows.rows as any[]).map(r => ({ date: r.date, total: r.total })),
      dailyUsers: (dailyUsersRows.rows as any[]).map(r => ({ date: r.date, count: r.cnt })),
    };
  }

  async getAllOrders(filters?: { search?: string; status?: string; paymentStatus?: string; storeId?: number }) {
    let query = sql`
      SELECT o.*, s.name as store_name, s.slug as store_slug
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE 1=1
    `;
    if (filters?.storeId) query = sql`${query} AND o.store_id = ${filters.storeId}`;
    if (filters?.status) query = sql`${query} AND o.status = ${filters.status}`;
    if (filters?.paymentStatus) query = sql`${query} AND o.payment_status = ${filters.paymentStatus}`;
    if (filters?.search) {
      const term = `%${filters.search}%`;
      query = sql`${query} AND (o.customer_name ILIKE ${term} OR o.customer_phone ILIKE ${term} OR CAST(o.order_number AS TEXT) ILIKE ${term})`;
    }
    query = sql`${query} ORDER BY o.created_at DESC LIMIT 200`;

    const rows = await db.execute(query);
    return (rows.rows as any[]).map(r => ({
      id: r.id,
      storeId: r.store_id,
      orderNumber: r.order_number,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerAddress: r.customer_address,
      customerComment: r.customer_comment,
      items: r.items,
      subtotal: r.subtotal,
      total: r.total,
      paymentMethod: r.payment_method,
      status: r.status,
      paymentStatus: r.payment_status,
      fulfillmentStatus: r.fulfillment_status,
      internalNote: r.internal_note,
      createdAt: r.created_at,
      storeName: r.store_name,
      storeSlug: r.store_slug,
    }));
  }

  async getStoreDetail(storeId: number) {
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
    if (!store) return null;

    const [owner] = await db.select({ email: users.email }).from(users).where(eq(users.id, store.ownerUserId));
    const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.storeId, storeId));
    const [theme] = await db.select().from(storeThemes).where(eq(storeThemes.storeId, storeId));
    const [prodCount] = await db.select({ count: count() }).from(products).where(eq(products.storeId, storeId));
    const [orderStats] = await db.execute(sql`SELECT COUNT(*)::int as cnt, COALESCE(SUM(total), 0)::int as revenue FROM orders WHERE store_id = ${storeId}`).then(r => r.rows as any[]);
    const [custCount] = await db.select({ count: count() }).from(customers).where(eq(customers.storeId, storeId));
    const recentOrders = await db.select().from(orders).where(eq(orders.storeId, storeId)).orderBy(desc(orders.createdAt)).limit(10);
    const recentCustomers = await db.select().from(customers).where(eq(customers.storeId, storeId)).orderBy(desc(customers.createdAt)).limit(10);

    const topProductsRows = await db.execute(sql`
      SELECT item->>'name' as name, SUM((item->>'quantity')::int)::int as quantity, SUM((item->>'price')::int * (item->>'quantity')::int)::int as revenue
      FROM orders, jsonb_array_elements(items::jsonb) as item
      WHERE store_id = ${storeId}
      GROUP BY item->>'name'
      ORDER BY revenue DESC
      LIMIT 10
    `);

    return {
      store,
      ownerEmail: owner?.email ?? null,
      settings: settings || null,
      theme: theme || null,
      productsCount: prodCount?.count ?? 0,
      ordersCount: orderStats?.cnt ?? 0,
      revenue: orderStats?.revenue ?? 0,
      customersCount: custCount?.count ?? 0,
      recentOrders,
      recentCustomers,
      topProducts: (topProductsRows.rows as any[]).map(r => ({ name: r.name, quantity: r.quantity, revenue: r.revenue })),
    };
  }

  async getPlatformEvents(filters?: { storeId?: number; eventType?: string; limit?: number }) {
    const lim = filters?.limit || 100;
    let query = sql`
      SELECT e.id, e.store_id, s.name as store_name, e.event_type, e.created_at
      FROM store_events e
      JOIN stores s ON e.store_id = s.id
      WHERE 1=1
    `;
    if (filters?.storeId) query = sql`${query} AND e.store_id = ${filters.storeId}`;
    if (filters?.eventType) query = sql`${query} AND e.event_type = ${filters.eventType}`;
    query = sql`${query} ORDER BY e.created_at DESC LIMIT ${lim}`;

    const rows = await db.execute(query);
    return (rows.rows as any[]).map(r => ({
      id: r.id,
      storeId: r.store_id,
      storeName: r.store_name,
      eventType: r.event_type,
      createdAt: r.created_at,
    }));
  }
  async getPlatformSetting(key: string): Promise<any | null> {
    const [row] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return row ? row.value : null;
  }

  async setPlatformSetting(key: string, value: any): Promise<void> {
    const [existing] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    if (existing) {
      await db.update(platformSettings).set({ value, updatedAt: new Date() }).where(eq(platformSettings.key, key));
    } else {
      await db.insert(platformSettings).values({ key, value });
    }
  }

  async getAllPlatformSettings(): Promise<{ key: string; value: any }[]> {
    const rows = await db.select().from(platformSettings);
    return rows.map(r => ({ key: r.key, value: r.value }));
  }
}

export const storage = new DatabaseStorage();
