import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSession, registerAuthRoutes, isAuthenticated, isSuperAdminMiddleware } from "./auth";
import { PLAN_LIMITS, PLAN_PRICES, PLAN_NAMES, PLAN_FEATURES, BUSINESS_TYPES } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  whatsappPhone: z.string().min(5).max(20).regex(/^[0-9]+$/),
  city: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  businessType: z.enum(Object.keys(BUSINESS_TYPES) as [string, ...string[]]).nullable().optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  price: z.coerce.number().int().min(0),
  discountPrice: z.coerce.number().int().min(0).nullable().optional(),
  categoryId: z.coerce.number().int().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
  imageUrls: z.array(z.string()).optional().default([]),
});

const updateProductSchema = createProductSchema.partial();

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});

const updateCategorySchema = createCategorySchema.partial();

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#2563eb"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  bannerOverlay: z.boolean().optional().default(true),
  buttonStyle: z.enum(["pill", "rounded", "square"]).optional().default("pill"),
  cardStyle: z.enum(["bordered", "shadow", "flat"]).optional().default("bordered"),
  fontStyle: z.enum(["modern", "classic", "rounded"]).optional().default("modern"),
});

const settingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  city: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  showPrices: z.boolean().optional(),
  checkoutAddressEnabled: z.boolean().optional(),
  checkoutCommentEnabled: z.boolean().optional(),
  instagramUrl: z.string().max(200).nullable().optional(),
  phoneNumber: z.string().max(30).nullable().optional(),
});

const whatsappSchema = z.object({
  phone: z.string().min(5).max(20).regex(/^[0-9]+$/),
  template: z.string().min(1).max(2000),
});

const eventSchema = z.object({
  eventType: z.enum(["visit", "add_to_cart", "checkout_click"]),
  metaJson: z.any().nullable().optional(),
});

function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupSession(app);
  registerAuthRoutes(app);

  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, path.basename(req.path));
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("Not found");
    }
  });

  app.post("/api/upload", isAuthenticated, upload.array("images", 5), (req: any, res) => {
    const userId = req.session.userId;
    const files = req.files as Express.Multer.File[];
    const urls = files.map((f) => `/uploads/${f.filename}`);
    res.json({ urls });
  });

  app.post("/api/stores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = validate(createStoreSchema, req.body);
      const existing = await storage.getStoreByOwner(userId);
      if (existing) {
        return res.status(400).json({ message: "У вас уже есть магазин" });
      }
      const slugCheck = await storage.getStoreBySlug(data.slug);
      if (slugCheck) {
        return res.status(400).json({ message: "Этот URL уже занят" });
      }
      const store = await storage.createStore({
        name: data.name,
        slug: data.slug,
        whatsappPhone: data.whatsappPhone,
        city: data.city || null,
        description: data.description || null,
        businessType: data.businessType || null,
        ownerUserId: userId,
        plan: "free",
        isActive: true,
      });
      res.json(store);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      res.json(store);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const prods = await storage.getProducts(store.id);
      res.json(prods);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/my-store/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });

      const data = validate(createProductSchema, req.body);

      const productCount = await storage.countProducts(store.id);
      const limit = PLAN_LIMITS[store.plan] || 30;
      if (productCount >= limit) {
        return res.status(400).json({ message: `Лимит товаров: ${limit}. Обновите тариф.` });
      }

      const product = await storage.createProduct({
        ...data,
        storeId: store.id,
      });
      res.json(product);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/my-store/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });

      const data = validate(updateProductSchema, req.body);
      const product = await storage.updateProduct(parseInt(req.params.id), store.id, data);
      if (!product) return res.status(404).json({ message: "Товар не найден" });
      res.json(product);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/my-store/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      await storage.deleteProduct(parseInt(req.params.id), store.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const cats = await storage.getCategories(store.id);
      res.json(cats);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/my-store/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const data = validate(createCategorySchema, req.body);
      const cat = await storage.createCategory({ ...data, storeId: store.id });
      res.json(cat);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/my-store/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const data = validate(updateCategorySchema, req.body);
      const cat = await storage.updateCategory(parseInt(req.params.id), store.id, data);
      if (!cat) return res.status(404).json({ message: "Категория не найдена" });
      res.json(cat);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/my-store/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      await storage.deleteCategory(parseInt(req.params.id), store.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/theme", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const theme = await storage.getTheme(store.id);
      res.json(theme || { storeId: store.id, primaryColor: "#2563eb", secondaryColor: null, logoUrl: null, bannerUrl: null, bannerOverlay: true, buttonStyle: "pill", cardStyle: "bordered", fontStyle: "modern" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/my-store/theme", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const data = validate(themeSchema, req.body);
      const theme = await storage.upsertTheme({ ...data, storeId: store.id });
      res.json(theme);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const settings = await storage.getSettings(store.id);
      res.json(settings || { storeId: store.id, showPrices: true, currency: "KZT", whatsappTemplate: "", instagramUrl: null, phoneNumber: null, checkoutAddressEnabled: false, checkoutCommentEnabled: false, kaspiEnabled: false, kaspiPayUrl: null, kaspiRecipientName: null });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/my-store/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });

      const data = validate(settingsSchema, req.body);

      if (data.slug && data.slug !== store.slug) {
        const slugCheck = await storage.getStoreBySlug(data.slug);
        if (slugCheck) return res.status(400).json({ message: "Этот URL уже занят" });
      }

      const storeUpdate: Record<string, any> = {};
      if (data.name !== undefined) storeUpdate.name = data.name;
      if (data.slug !== undefined) storeUpdate.slug = data.slug;
      if (data.city !== undefined) storeUpdate.city = data.city || null;
      if (data.description !== undefined) storeUpdate.description = data.description || null;
      if (Object.keys(storeUpdate).length > 0) {
        await storage.updateStore(store.id, storeUpdate);
      }

      const existingSettings = await storage.getSettings(store.id);
      const settings = await storage.upsertSettings({
        storeId: store.id,
        showPrices: data.showPrices ?? existingSettings?.showPrices ?? true,
        instagramUrl: data.instagramUrl !== undefined ? (data.instagramUrl || null) : (existingSettings?.instagramUrl || null),
        phoneNumber: data.phoneNumber !== undefined ? (data.phoneNumber || null) : (existingSettings?.phoneNumber || null),
        checkoutAddressEnabled: data.checkoutAddressEnabled ?? existingSettings?.checkoutAddressEnabled ?? false,
        checkoutCommentEnabled: data.checkoutCommentEnabled ?? existingSettings?.checkoutCommentEnabled ?? false,
        currency: "KZT",
        whatsappTemplate: existingSettings?.whatsappTemplate || "",
        kaspiEnabled: existingSettings?.kaspiEnabled ?? false,
        kaspiPayUrl: existingSettings?.kaspiPayUrl || null,
        kaspiRecipientName: existingSettings?.kaspiRecipientName || null,
      });
      res.json(settings);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/my-store/whatsapp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });

      const data = validate(whatsappSchema, req.body);
      await storage.updateStore(store.id, { whatsappPhone: data.phone });

      const existingSettings = await storage.getSettings(store.id);
      const settings = await storage.upsertSettings({
        storeId: store.id,
        whatsappTemplate: data.template,
        showPrices: existingSettings?.showPrices ?? true,
        currency: "KZT",
        instagramUrl: existingSettings?.instagramUrl || null,
        phoneNumber: existingSettings?.phoneNumber || null,
        checkoutAddressEnabled: existingSettings?.checkoutAddressEnabled ?? false,
        checkoutCommentEnabled: existingSettings?.checkoutCommentEnabled ?? false,
        kaspiEnabled: existingSettings?.kaspiEnabled ?? false,
        kaspiPayUrl: existingSettings?.kaspiPayUrl || null,
        kaspiRecipientName: existingSettings?.kaspiRecipientName || null,
      });
      res.json(settings);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const ordersList = await storage.getOrdersByStore(store.id);
      res.json(ordersList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const updateOrderSchema = z.object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
    paymentStatus: z.enum(["unpaid", "confirming", "partially_paid", "paid", "refunded", "voided"]).optional(),
    fulfillmentStatus: z.enum(["unfulfilled", "fulfilled", "partially_fulfilled"]).optional(),
    internalNote: z.string().max(1000).nullable().optional(),
  });

  app.patch("/api/my-store/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });

      const data = validate(updateOrderSchema, req.body);
      const order = await storage.updateOrder(parseInt(req.params.id), store.id, data);
      if (!order) return res.status(404).json({ message: "Заказ не найден" });
      res.json(order);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const analytics = await storage.getAnalytics(store.id);
      res.json(analytics);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/analytics/detailed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      let endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
      const data = await storage.getDetailedAnalytics(store.id, startDate, endDate);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/tariffs", async (_req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      const plans = ["free", "pro", "business"];
      const result: Record<string, { price: number; limit: number; name: string; features: string[] }> = {};
      for (const plan of plans) {
        const saved = settings.find((s) => s.key === `plan_${plan}`);
        if (saved && saved.value) {
          const v = saved.value as any;
          result[plan] = {
            price: v.price ?? PLAN_PRICES[plan],
            limit: v.limit ?? PLAN_LIMITS[plan],
            name: v.name ?? PLAN_NAMES[plan],
            features: v.features ?? PLAN_FEATURES[plan],
          };
        } else {
          result[plan] = {
            price: PLAN_PRICES[plan],
            limit: PLAN_LIMITS[plan],
            name: PLAN_NAMES[plan],
            features: PLAN_FEATURES[plan],
          };
        }
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/storefront/:slug", async (req, res) => {
    try {
      const store = await storage.getStoreBySlug(req.params.slug);
      if (!store || !store.isActive) return res.status(404).json({ message: "Магазин не найден" });

      const [theme, settings, cats, prods] = await Promise.all([
        storage.getTheme(store.id),
        storage.getSettings(store.id),
        storage.getCategories(store.id),
        storage.getProducts(store.id),
      ]);

      await storage.recordEvent({ storeId: store.id, eventType: "visit" }).catch(() => {});

      res.json({
        store,
        theme: theme || { primaryColor: "#2563eb", secondaryColor: null, logoUrl: null, bannerUrl: null, bannerOverlay: true, buttonStyle: "pill", cardStyle: "bordered", fontStyle: "modern" },
        settings: settings || { showPrices: true, whatsappTemplate: "", instagramUrl: null, phoneNumber: null, checkoutAddressEnabled: false, checkoutCommentEnabled: false, kaspiEnabled: false, kaspiPayUrl: null, kaspiRecipientName: null },
        categories: cats.filter((c) => c.isActive),
        products: prods.filter((p) => p.isActive),
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const orderSchema = z.object({
    customerName: z.string().min(1).max(200),
    customerPhone: z.string().min(5).max(30),
    customerAddress: z.string().max(500).nullable().optional(),
    customerComment: z.string().max(1000).nullable().optional(),
    items: z.array(z.object({
      productId: z.number(),
      name: z.string(),
      quantity: z.number().min(1),
      price: z.number(),
      imageUrl: z.string().nullable().optional(),
    })).min(1),
    paymentMethod: z.string().max(30).nullable().optional(),
  });

  app.post("/api/storefront/:slug/order", async (req, res) => {
    try {
      const data = validate(orderSchema, req.body);
      const store = await storage.getStoreBySlug(req.params.slug);
      if (!store) return res.status(404).json({ message: "Not found" });

      const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const orderNumber = await storage.getNextOrderNumber(store.id);

      const order = await storage.createOrder({
        storeId: store.id,
        orderNumber,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress || null,
        customerComment: data.customerComment || null,
        items: data.items,
        subtotal,
        total: subtotal,
        paymentMethod: data.paymentMethod || null,
        status: "pending",
      });

      await storage.upsertCustomerFromOrder(store.id, data.customerName, data.customerPhone, subtotal).catch(() => {});

      res.json(order);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid order ID" });

      const order = await storage.getOrder(id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const allStores = await storage.getAllStores();
      const store = allStores.find(s => s.id === order.storeId);

      res.json({ order, storeName: store?.name, storeSlug: store?.slug });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createCustomerSchema = z.object({
    name: z.string().min(1).max(200),
    phone: z.string().max(30).nullable().optional(),
    email: z.string().max(200).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  });

  const updateCustomerSchema = createCustomerSchema.partial();

  app.get("/api/my-store/customers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const customersList = await storage.getCustomersByStore(store.id);
      res.json(customersList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/my-store/customers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const data = validate(createCustomerSchema, req.body);
      const customer = await storage.createCustomer({
        ...data,
        storeId: store.id,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      });
      res.json(customer);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/my-store/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const data = validate(updateCustomerSchema, req.body);
      const customer = await storage.updateCustomer(parseInt(req.params.id), store.id, data);
      if (!customer) return res.status(404).json({ message: "Клиент не найден" });
      res.json(customer);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/my-store/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      await storage.deleteCustomer(parseInt(req.params.id), store.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/storefront/:slug/event", async (req, res) => {
    try {
      const data = validate(eventSchema, req.body);
      const store = await storage.getStoreBySlug(req.params.slug);
      if (!store) return res.status(404).json({ message: "Not found" });
      await storage.recordEvent({
        storeId: store.id,
        eventType: data.eventType,
        metaJson: data.metaJson || null,
      });
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/analytics", isSuperAdminMiddleware, async (_req, res) => {
    try {
      const data = await storage.getPlatformAnalytics();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/stores", isSuperAdminMiddleware, async (_req, res) => {
    try {
      const data = await storage.getAllStoresWithStats();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/superadmin/stores/:id/plan", isSuperAdminMiddleware, async (req, res) => {
    try {
      const planSchema = z.object({
        plan: z.enum(["free", "pro", "business"]),
        planStartedAt: z.string().optional(),
        planExpiresAt: z.string().nullable().optional(),
      });
      const data = validate(planSchema, req.body);
      const planStartedAt = data.plan === "free" ? null : (data.planStartedAt ? new Date(data.planStartedAt) : new Date());
      const planExpiresAt = data.plan === "free" ? null : (data.planExpiresAt === null ? null : (data.planExpiresAt ? new Date(data.planExpiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
      const store = await storage.updateStorePlan(parseInt(req.params.id), data.plan, planStartedAt, planExpiresAt);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      res.json(store);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/superadmin/stores/:id/active", isSuperAdminMiddleware, async (req, res) => {
    try {
      const schema = z.object({ isActive: z.boolean() });
      const data = validate(schema, req.body);
      const store = await storage.toggleStoreActive(parseInt(req.params.id), data.isActive);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      res.json(store);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/users", isSuperAdminMiddleware, async (_req, res) => {
    try {
      const data = await storage.getAllUsers();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/superadmin/users/:id/superadmin", isSuperAdminMiddleware, async (req, res) => {
    try {
      const schema = z.object({ isSuperAdmin: z.boolean() });
      const data = validate(schema, req.body);
      await storage.setUserSuperAdmin(req.params.id, data.isSuperAdmin);
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/trends", isSuperAdminMiddleware, async (req, res) => {
    try {
      const now = new Date();
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : now;
      const data = await storage.getPlatformTrends(startDate, endDate);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/orders", isSuperAdminMiddleware, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.search) filters.search = req.query.search;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
      if (req.query.storeId) filters.storeId = parseInt(req.query.storeId as string);
      const data = await storage.getAllOrders(filters);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/stores/:id", isSuperAdminMiddleware, async (req, res) => {
    try {
      const data = await storage.getStoreDetail(parseInt(req.params.id));
      if (!data) return res.status(404).json({ message: "Магазин не найден" });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/events", isSuperAdminMiddleware, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.storeId) filters.storeId = parseInt(req.query.storeId as string);
      if (req.query.eventType) filters.eventType = req.query.eventType;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      const data = await storage.getPlatformEvents(filters);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/tariffs", isSuperAdminMiddleware, async (_req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      const planConfig: Record<string, any> = {};
      for (const s of settings) {
        if (s.key.startsWith("plan_")) {
          planConfig[s.key] = s.value;
        }
      }
      res.json(planConfig);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/superadmin/tariffs/:plan", isSuperAdminMiddleware, async (req, res) => {
    try {
      const planKey = req.params.plan;
      if (!["free", "pro", "business"].includes(planKey)) {
        return res.status(400).json({ message: "Неизвестный тариф" });
      }
      const schema = z.object({
        price: z.number().min(0),
        limit: z.number().min(1),
        name: z.string().min(1),
        features: z.array(z.string()),
      });
      const data = validate(schema, req.body);
      await storage.setPlatformSetting(`plan_${planKey}`, data);
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
