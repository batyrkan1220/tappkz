import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { PLAN_LIMITS } from "@shared/schema";
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
  logoUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
});

const settingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  city: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  showPrices: z.boolean().optional(),
  instagramUrl: z.string().max(200).nullable().optional(),
  phoneNumber: z.string().max(30).nullable().optional(),
});

const kaspiSchema = z.object({
  kaspiEnabled: z.boolean(),
  kaspiPayUrl: z.string().max(500).nullable().optional(),
  kaspiRecipientName: z.string().max(200).nullable().optional(),
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
  await setupAuth(app);
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
    const userId = req.user.claims.sub;
    const files = req.files as Express.Multer.File[];
    const urls = files.map((f) => `/uploads/${f.filename}`);
    res.json({ urls });
  });

  app.post("/api/stores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      res.json(store);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const theme = await storage.getTheme(store.id);
      res.json(theme || { storeId: store.id, primaryColor: "#2563eb", logoUrl: null, bannerUrl: null });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/my-store/theme", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const settings = await storage.getSettings(store.id);
      res.json(settings || { storeId: store.id, showPrices: true, currency: "KZT", whatsappTemplate: "", instagramUrl: null, phoneNumber: null });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/my-store/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  app.put("/api/my-store/kaspi", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });

      const data = validate(kaspiSchema, req.body);

      const existingSettings = await storage.getSettings(store.id);
      const settings = await storage.upsertSettings({
        storeId: store.id,
        kaspiEnabled: data.kaspiEnabled,
        kaspiPayUrl: data.kaspiPayUrl || null,
        kaspiRecipientName: data.kaspiRecipientName || null,
        showPrices: existingSettings?.showPrices ?? true,
        currency: "KZT",
        whatsappTemplate: existingSettings?.whatsappTemplate || "",
        instagramUrl: existingSettings?.instagramUrl || null,
        phoneNumber: existingSettings?.phoneNumber || null,
      });
      res.json(settings);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/my-store/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const analytics = await storage.getAnalytics(store.id);
      res.json(analytics);
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
        theme: theme || { primaryColor: "#2563eb", logoUrl: null, bannerUrl: null },
        settings: settings || { showPrices: true, whatsappTemplate: "", instagramUrl: null, phoneNumber: null, kaspiEnabled: false, kaspiPayUrl: null, kaspiRecipientName: null },
        categories: cats.filter((c) => c.isActive),
        products: prods.filter((p) => p.isActive),
      });
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

  return httpServer;
}
