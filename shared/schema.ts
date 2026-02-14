import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const BUSINESS_TYPES = {
  restaurant: { label: "Ресторан", group: "fnb", itemLabel: "блюдо", itemLabelPlural: "Меню", categoryLabel: "Раздел меню" },
  cafe: { label: "Кафе", group: "fnb", itemLabel: "блюдо", itemLabelPlural: "Меню", categoryLabel: "Раздел меню" },
  home_food: { label: "Домашняя еда", group: "fnb", itemLabel: "блюдо", itemLabelPlural: "Меню", categoryLabel: "Раздел меню" },
  bakery: { label: "Пекарня и кондитерская", group: "fnb", itemLabel: "изделие", itemLabelPlural: "Меню", categoryLabel: "Раздел меню" },
  catering: { label: "Кейтеринг", group: "fnb", itemLabel: "блюдо", itemLabelPlural: "Меню", categoryLabel: "Раздел меню" },
  hotel_restaurant: { label: "Ресторан при отеле", group: "fnb", itemLabel: "блюдо", itemLabelPlural: "Меню", categoryLabel: "Раздел меню" },
  grocery: { label: "Продукты и мясо", group: "fnb", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  ecommerce: { label: "Интернет-магазин", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  fashion: { label: "Одежда и обувь", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  pharmacy: { label: "Аптека и здоровье", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  electronics: { label: "Электроника и телефоны", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  digital: { label: "Цифровые товары", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  popup: { label: "Pop-up магазин", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  personal_shopping: { label: "Шоппинг-услуги", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  jewelry: { label: "Украшения и аксессуары", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  b2b: { label: "B2B и оптовая торговля", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" },
  salon: { label: "Салон красоты", group: "service", itemLabel: "услугу", itemLabelPlural: "Услуги", categoryLabel: "Категория услуг" },
  laundry: { label: "Прачечная и химчистка", group: "service", itemLabel: "услугу", itemLabelPlural: "Услуги", categoryLabel: "Категория услуг" },
  professional: { label: "Профессиональные услуги", group: "service", itemLabel: "услугу", itemLabelPlural: "Услуги", categoryLabel: "Категория услуг" },
  pets: { label: "Зоотовары и груминг", group: "service", itemLabel: "услугу", itemLabelPlural: "Услуги", categoryLabel: "Категория услуг" },
  hotel: { label: "Бронирование жилья", group: "service", itemLabel: "услугу", itemLabelPlural: "Услуги", categoryLabel: "Категория услуг" },
  education: { label: "Образование и курсы", group: "service", itemLabel: "курс", itemLabelPlural: "Услуги", categoryLabel: "Категория" },
  printing: { label: "Типография и печать", group: "service", itemLabel: "услугу", itemLabelPlural: "Услуги", categoryLabel: "Категория услуг" },
  rental: { label: "Аренда", group: "service", itemLabel: "услугу", itemLabelPlural: "Услуги", categoryLabel: "Категория" },
  travel: { label: "Туризм и путешествия", group: "service", itemLabel: "тур", itemLabelPlural: "Услуги", categoryLabel: "Категория" },
  ticketing: { label: "Билеты и мероприятия", group: "service", itemLabel: "билет", itemLabelPlural: "Услуги", categoryLabel: "Категория" },
} as const;

export type BusinessTypeKey = keyof typeof BUSINESS_TYPES;

export function getBusinessLabels(businessType: string | null | undefined) {
  const bt = businessType as BusinessTypeKey;
  if (bt && BUSINESS_TYPES[bt]) return BUSINESS_TYPES[bt];
  return { label: "Магазин", group: "ecommerce", itemLabel: "товар", itemLabelPlural: "Товары", categoryLabel: "Категория" };
}

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  ownerUserId: varchar("owner_user_id").notNull(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  whatsappPhone: varchar("whatsapp_phone", { length: 20 }).notNull(),
  city: text("city"),
  description: text("description"),
  businessType: varchar("business_type", { length: 50 }),
  plan: varchar("plan", { length: 20 }).notNull().default("free"),
  planStartedAt: timestamp("plan_started_at"),
  planExpiresAt: timestamp("plan_expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storeThemes = pgTable("store_themes", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  primaryColor: varchar("primary_color", { length: 7 }).notNull().default("#2563eb"),
  secondaryColor: varchar("secondary_color", { length: 7 }),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  bannerOverlay: boolean("banner_overlay").notNull().default(true),
  buttonStyle: varchar("button_style", { length: 20 }).notNull().default("pill"),
  cardStyle: varchar("card_style", { length: 20 }).notNull().default("bordered"),
  fontStyle: varchar("font_style", { length: 20 }).notNull().default("modern"),
});

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  showPrices: boolean("show_prices").notNull().default(true),
  currency: varchar("currency", { length: 5 }).notNull().default("KZT"),
  whatsappTemplate: text("whatsapp_template").notNull().default(
    "Новый заказ из {store_name}!\n\nКлиент: {customer_name}\nТелефон: {customer_phone}\nАдрес: {address}\nКомментарий: {comment}\n\nТовары:\n{items}\n\nИтого: {total} ₸"
  ),
  instagramUrl: text("instagram_url"),
  phoneNumber: text("phone_number"),
  checkoutAddressEnabled: boolean("checkout_address_enabled").notNull().default(false),
  checkoutCommentEnabled: boolean("checkout_comment_enabled").notNull().default(false),
  kaspiEnabled: boolean("kaspi_enabled").notNull().default(false),
  kaspiPayUrl: text("kaspi_pay_url"),
  kaspiRecipientName: text("kaspi_recipient_name"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  discountPrice: integer("discount_price"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  imageUrls: text("image_urls").array().notNull().default(sql`'{}'::text[]`),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  orderNumber: integer("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  customerComment: text("customer_comment"),
  items: jsonb("items").notNull(),
  subtotal: integer("subtotal").notNull(),
  total: integer("total").notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("unpaid"),
  fulfillmentStatus: varchar("fulfillment_status", { length: 30 }).notNull().default("unfulfilled"),
  internalNote: text("internal_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 200 }),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  firstOrderAt: timestamp("first_order_at"),
  lastOrderAt: timestamp("last_order_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storeEvents = pgTable("store_events", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 30 }).notNull(),
  metaJson: jsonb("meta_json"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("idx_store_events_store").on(table.storeId, table.eventType)]);

export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({ id: true, updatedAt: true });
export type PlatformSetting = typeof platformSettings.$inferSelect;

export const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "До 30 товаров",
    "1 магазин",
    "WhatsApp заказы",
    "Базовая аналитика",
  ],
  pro: [
    "До 300 товаров",
    "1 магазин",
    "WhatsApp заказы",
    "Подробная аналитика",
    "Кастомный домен",
    "Приоритетная поддержка",
  ],
  business: [
    "До 2000 товаров",
    "1 магазин",
    "WhatsApp заказы",
    "Расширенная аналитика",
    "Кастомный домен",
    "API доступ",
    "Персональный менеджер",
  ],
};

export const ordersRelations = relations(orders, ({ one }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  store: one(stores, { fields: [customers.storeId], references: [stores.id] }),
}));

export const storesRelations = relations(stores, ({ many, one }) => ({
  theme: one(storeThemes, { fields: [stores.id], references: [storeThemes.storeId] }),
  settings: one(storeSettings, { fields: [stores.id], references: [storeSettings.storeId] }),
  categories: many(categories),
  products: many(products),
  events: many(storeEvents),
  orders: many(orders),
  customers: many(customers),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  store: one(stores, { fields: [categories.storeId], references: [stores.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const storeThemesRelations = relations(storeThemes, ({ one }) => ({
  store: one(stores, { fields: [storeThemes.storeId], references: [stores.id] }),
}));

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  store: one(stores, { fields: [storeSettings.storeId], references: [stores.id] }),
}));

export const storeEventsRelations = relations(storeEvents, ({ one }) => ({
  store: one(stores, { fields: [storeEvents.storeId], references: [stores.id] }),
}));

export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertStoreThemeSchema = createInsertSchema(storeThemes).omit({ id: true });
export const insertStoreSettingsSchema = createInsertSchema(storeSettings).omit({ id: true });
export const insertStoreEventSchema = createInsertSchema(storeEvents).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type StoreTheme = typeof storeThemes.$inferSelect;
export type InsertStoreTheme = z.infer<typeof insertStoreThemeSchema>;
export type StoreSettings = typeof storeSettings.$inferSelect;
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type StoreEvent = typeof storeEvents.$inferSelect;
export type InsertStoreEvent = z.infer<typeof insertStoreEventSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export const PLAN_LIMITS: Record<string, number> = {
  free: 30,
  pro: 300,
  business: 2000,
};

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  pro: 4990,
  business: 14990,
};

export const PLAN_NAMES: Record<string, string> = {
  free: "Бесплатный",
  pro: "Профессиональный",
  business: "Бизнес",
};
