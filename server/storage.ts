import {
  stores, storeThemes, storeSettings, categories, products, storeEvents, orders, customers,
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
import { db } from "./db";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";

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

  getAllStores(): Promise<Store[]>;
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

  async getAllStores(): Promise<Store[]> {
    return db.select().from(stores).orderBy(desc(stores.createdAt));
  }
}

export const storage = new DatabaseStorage();
