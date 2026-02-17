import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSession, registerAuthRoutes, isAuthenticated, isSuperAdminMiddleware } from "./auth";
import { PLAN_LIMITS, PLAN_ORDER_LIMITS, PLAN_IMAGE_LIMITS, PLAN_PRICES, PLAN_NAMES, PLAN_FEATURES, BUSINESS_TYPES, emailBroadcasts, insertDiscountSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { sendOrderNotification, sendTextMessage, sendTemplateMessage, getWabaConfig, getWabaConfigRaw, saveWabaConfig, getMessageLog, getMessageStats, getOnboardingConfig, saveOnboardingConfig, sendOnboardingStoreCreated } from "./whatsapp";
import { sendBroadcastEmail } from "./email";

import { users } from "@shared/models/auth";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";

const uploadDir = path.join(process.cwd(), "uploads");
const thumbDir = path.join(uploadDir, "thumbs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
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

const variantOptionSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(100),
  price: z.coerce.number().int().min(0).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  sku: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

const variantGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  options: z.array(variantOptionSchema).min(1),
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
  sku: z.string().max(50).nullable().optional(),
  unit: z.string().max(30).nullable().optional(),
  productType: z.enum(["physical", "digital"]).optional().default("physical"),
  downloadUrl: z.string().max(500).nullable().optional(),
  attributes: z.record(z.any()).optional().default({}),
  variants: z.array(variantGroupSchema).optional().default([]),
});

const updateProductSchema = createProductSchema.partial();

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
  description: z.string().max(500).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
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
  whatsappPhone: z.string().min(5).max(20).regex(/^[0-9]+$/).optional(),
  email: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  orderPhones: z.array(z.string().max(20)).optional(),
  city: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  businessType: z.enum(Object.keys(BUSINESS_TYPES) as [string, ...string[]]).nullable().optional(),
  showPrices: z.boolean().optional(),
  checkoutAddressEnabled: z.boolean().optional(),
  checkoutCommentEnabled: z.boolean().optional(),
  instagramUrl: z.string().max(200).nullable().optional(),
  phoneNumber: z.string().max(30).nullable().optional(),
  facebookPixelId: z.string().max(50).regex(/^[0-9]*$/, "Только цифры").nullable().optional(),
  tiktokPixelId: z.string().max(50).regex(/^[A-Za-z0-9_]*$/, "Только латинские буквы и цифры").nullable().optional(),
  googleAnalyticsId: z.string().max(30).regex(/^(G-[A-Za-z0-9]+|UA-[0-9]+-[0-9]+)?$/, "Формат G-XXXXXXX или UA-XXXXXXX-X").nullable().optional(),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(500).nullable().optional(),
  ogImageUrl: z.string().max(1000).nullable().optional(),
  faviconUrl: z.string().max(1000).nullable().optional(),
  isPublicListed: z.boolean().optional(),
  announcementText: z.string().max(500).nullable().optional(),
  showAnnouncement: z.boolean().optional(),
  telegramUrl: z.string().max(200).nullable().optional(),
  showSocialCards: z.boolean().optional(),
  showCategoryChips: z.boolean().optional(),
  categoryDisplayStyle: z.enum(["chips", "grid", "list"]).optional(),
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

  app.get("/robots.txt", (_req, res) => {
    const baseUrl = `${_req.headers["x-forwarded-proto"] || _req.protocol}://${_req.headers["x-forwarded-host"] || _req.headers.host}`;
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /superadmin\nDisallow: /api/\nDisallow: /login\nDisallow: /register\nDisallow: /forgot-password\nDisallow: /invoice/\n\nSitemap: ${baseUrl}/sitemap.xml`
    );
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = `${req.headers["x-forwarded-proto"] || req.protocol}://${req.headers["x-forwarded-host"] || req.headers.host}`;
      const stores = await storage.getAllStores();
      const activeStores = stores.filter((s: any) => s.isActive);
      const today = new Date().toISOString().split("T")[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      for (const store of activeStores) {
        const lastmod = store.createdAt ? new Date(store.createdAt).toISOString().split("T")[0] : today;
        xml += `  <url>\n    <loc>${baseUrl}/${encodeURIComponent(store.slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
      xml += `</urlset>`;

      res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(xml);
    } catch {
      res.status(500).send("Error generating sitemap");
    }
  });

  app.use("/uploads/thumbs", (req, res) => {
    const filename = path.basename(req.path);
    const thumbFilePath = path.join(thumbDir, filename);

    if (fs.existsSync(thumbFilePath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(thumbFilePath);
    }

    const webpName = filename.replace(/\.(jpg|jpeg|png|gif|bmp)$/i, ".webp");
    const webpThumbPath = path.join(thumbDir, webpName);
    if (webpName !== filename && fs.existsSync(webpThumbPath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(webpThumbPath);
    }

    const originalPath = path.join(uploadDir, filename);
    const webpOriginal = path.join(uploadDir, filename.replace(/\.(jpg|jpeg|png|gif|bmp)$/i, ".webp"));
    const sourceFile = fs.existsSync(originalPath) ? originalPath : (fs.existsSync(webpOriginal) ? webpOriginal : null);

    if (sourceFile) {
      sharp(sourceFile)
        .resize(400, 400, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(webpThumbPath)
        .then(() => {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.sendFile(webpThumbPath);
        })
        .catch(() => {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.sendFile(sourceFile);
        });
    } else {
      res.status(404).send("Not found");
    }
  });

  app.use("/uploads", (req, res) => {
    const filePath = path.join(uploadDir, path.basename(req.path));
    if (fs.existsSync(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.sendFile(filePath);
    } else {
      res.status(404).send("Not found");
    }
  });

  app.post("/api/upload", isAuthenticated, upload.array("images", 5), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (store) {
        const planLimits = await storage.getEffectivePlanLimits(store.plan);
        if (planLimits.imageLimit > 0) {
          const currentImages = await storage.countImages(store.id);
          const files = req.files as Express.Multer.File[];
          if (currentImages + files.length > planLimits.imageLimit) {
            return res.status(400).json({ message: `Лимит изображений: ${planLimits.imageLimit}. Обновите тариф.` });
          }
        }
      }
      const files = req.files as Express.Multer.File[];
      const urls: string[] = [];

      for (const f of files) {
        const originalPath = path.join(uploadDir, f.filename);
        const ext = path.extname(f.filename);
        const baseName = path.basename(f.filename, ext);
        const optimizedName = `${baseName}.webp`;
        const optimizedPath = path.join(uploadDir, optimizedName);
        const thumbPath = path.join(thumbDir, optimizedName);

        try {
          await sharp(originalPath)
            .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(optimizedPath);

          await sharp(originalPath)
            .resize(400, 400, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 70 })
            .toFile(thumbPath);

          if (originalPath !== optimizedPath) {
            fs.unlinkSync(originalPath);
          }

          urls.push(`/uploads/${optimizedName}`);
        } catch (sharpErr) {
          urls.push(`/uploads/${f.filename}`);
        }
      }

      res.json({ urls });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const RESERVED_SLUGS = new Set([
    "admin", "login", "register", "invoice", "superadmin", "api", "uploads",
    "settings", "dashboard", "forgot-password", "reset-password",
  ]);

  app.get("/api/check-slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug.toLowerCase();
      if (RESERVED_SLUGS.has(slug)) {
        return res.json({ available: false, reason: "Этот адрес уже занят" });
      }
      const existing = await storage.getStoreBySlug(slug);
      res.json({ available: !existing, reason: existing ? "Этот адрес уже занят другим магазином" : null });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/stores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = validate(createStoreSchema, req.body);
      const existing = await storage.getStoreByOwner(userId);
      if (existing) {
        return res.status(400).json({ message: "У вас уже есть магазин" });
      }
      if (RESERVED_SLUGS.has(data.slug)) {
        return res.status(400).json({ message: "Этот адрес уже занят" });
      }
      const slugCheck = await storage.getStoreBySlug(data.slug);
      if (slugCheck) {
        return res.status(400).json({ message: "Этот адрес уже занят" });
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

      const [owner] = await db.select().from(users).where(eq(users.id, userId));
      const ownerPhone = owner?.phone || data.whatsappPhone;
      if (ownerPhone) {
        sendOnboardingStoreCreated(ownerPhone, data.name, data.slug).catch((err) => {
          console.error("Onboarding store-created error:", err);
        });
      }

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
      const planLimits = await storage.getEffectivePlanLimits(store.plan);
      if (planLimits.productLimit > 0 && productCount >= planLimits.productLimit) {
        return res.status(400).json({ message: `Лимит товаров: ${planLimits.productLimit}. Обновите тариф.` });
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

  app.put("/api/my-store/categories/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const { order } = req.body;
      if (!Array.isArray(order)) return res.status(400).json({ message: "Некорректные данные" });
      for (let i = 0; i < order.length; i++) {
        await storage.updateCategory(order[i], store.id, { sortOrder: i });
      }
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
      res.json(settings || { storeId: store.id, showPrices: true, currency: "KZT", whatsappTemplate: "", instagramUrl: null, phoneNumber: null, checkoutAddressEnabled: false, checkoutCommentEnabled: false });
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
        if (RESERVED_SLUGS.has(data.slug)) return res.status(400).json({ message: "Этот адрес уже занят" });
        const slugCheck = await storage.getStoreBySlug(data.slug);
        if (slugCheck) return res.status(400).json({ message: "Этот адрес уже занят" });
      }

      const storeUpdate: Record<string, any> = {};
      if (data.name !== undefined) storeUpdate.name = data.name;
      if (data.slug !== undefined) storeUpdate.slug = data.slug;
      if (data.whatsappPhone !== undefined) storeUpdate.whatsappPhone = data.whatsappPhone;
      if (data.email !== undefined) storeUpdate.email = data.email || null;
      if (data.address !== undefined) storeUpdate.address = data.address || null;
      if (data.orderPhones !== undefined) storeUpdate.orderPhones = data.orderPhones;
      if (data.city !== undefined) storeUpdate.city = data.city || null;
      if (data.description !== undefined) storeUpdate.description = data.description || null;
      if (data.businessType !== undefined) storeUpdate.businessType = data.businessType || null;
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
        facebookPixelId: data.facebookPixelId !== undefined ? (data.facebookPixelId || null) : (existingSettings?.facebookPixelId || null),
        tiktokPixelId: data.tiktokPixelId !== undefined ? (data.tiktokPixelId || null) : (existingSettings?.tiktokPixelId || null),
        googleAnalyticsId: data.googleAnalyticsId !== undefined ? (data.googleAnalyticsId || null) : (existingSettings?.googleAnalyticsId || null),
        seoTitle: data.seoTitle !== undefined ? (data.seoTitle || null) : (existingSettings?.seoTitle || null),
        seoDescription: data.seoDescription !== undefined ? (data.seoDescription || null) : (existingSettings?.seoDescription || null),
        ogImageUrl: data.ogImageUrl !== undefined ? (data.ogImageUrl || null) : (existingSettings?.ogImageUrl || null),
        faviconUrl: data.faviconUrl !== undefined ? (data.faviconUrl || null) : (existingSettings?.faviconUrl || null),
        isPublicListed: data.isPublicListed ?? existingSettings?.isPublicListed ?? true,
        announcementText: data.announcementText !== undefined ? (data.announcementText || null) : (existingSettings?.announcementText || null),
        showAnnouncement: data.showAnnouncement ?? existingSettings?.showAnnouncement ?? false,
        telegramUrl: data.telegramUrl !== undefined ? (data.telegramUrl || null) : (existingSettings?.telegramUrl || null),
        showSocialCards: data.showSocialCards ?? existingSettings?.showSocialCards ?? true,
        showCategoryChips: data.showCategoryChips ?? existingSettings?.showCategoryChips ?? true,
        categoryDisplayStyle: data.categoryDisplayStyle ?? existingSettings?.categoryDisplayStyle ?? "chips",
        currency: "KZT",
        whatsappTemplate: existingSettings?.whatsappTemplate || "",
      });
      res.json(settings);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      }
      res.status(500).json({ message: e.message });
    }
  });

  const deliverySettingsSchema = z.object({
    deliveryEnabled: z.boolean().optional(),
    pickupEnabled: z.boolean().optional(),
    deliveryFee: z.coerce.number().int().min(0).nullable().optional(),
    deliveryFreeThreshold: z.coerce.number().int().min(0).nullable().optional(),
    pickupAddress: z.string().max(500).nullable().optional(),
    deliveryZone: z.string().max(500).nullable().optional(),
    pickupLat: z.string().max(30).nullable().optional().refine(
      (v) => !v || !isNaN(parseFloat(v)),
      { message: "pickupLat must be a valid number" }
    ),
    pickupLon: z.string().max(30).nullable().optional().refine(
      (v) => !v || !isNaN(parseFloat(v)),
      { message: "pickupLon must be a valid number" }
    ),
  });

  app.get("/api/my-store/delivery", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const settings = await storage.getSettings(store.id);
      res.json({
        deliveryEnabled: settings?.deliveryEnabled ?? false,
        pickupEnabled: settings?.pickupEnabled ?? true,
        deliveryFee: settings?.deliveryFee ?? null,
        deliveryFreeThreshold: settings?.deliveryFreeThreshold ?? null,
        pickupAddress: settings?.pickupAddress ?? null,
        deliveryZone: settings?.deliveryZone ?? null,
        pickupLat: settings?.pickupLat ?? null,
        pickupLon: settings?.pickupLon ?? null,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/my-store/delivery", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });

      const data = validate(deliverySettingsSchema, req.body);
      const existingSettings = await storage.getSettings(store.id);

      const settings = await storage.upsertSettings({
        storeId: store.id,
        showPrices: existingSettings?.showPrices ?? true,
        currency: existingSettings?.currency ?? "KZT",
        whatsappTemplate: existingSettings?.whatsappTemplate || "",
        instagramUrl: existingSettings?.instagramUrl || null,
        phoneNumber: existingSettings?.phoneNumber || null,
        checkoutAddressEnabled: existingSettings?.checkoutAddressEnabled ?? false,
        checkoutCommentEnabled: existingSettings?.checkoutCommentEnabled ?? false,
        facebookPixelId: existingSettings?.facebookPixelId || null,
        tiktokPixelId: existingSettings?.tiktokPixelId || null,
        deliveryEnabled: data.deliveryEnabled ?? existingSettings?.deliveryEnabled ?? false,
        pickupEnabled: data.pickupEnabled ?? existingSettings?.pickupEnabled ?? true,
        deliveryFee: data.deliveryFee !== undefined ? data.deliveryFee : (existingSettings?.deliveryFee ?? null),
        deliveryFreeThreshold: data.deliveryFreeThreshold !== undefined ? data.deliveryFreeThreshold : (existingSettings?.deliveryFreeThreshold ?? null),
        pickupAddress: data.pickupAddress !== undefined ? data.pickupAddress : (existingSettings?.pickupAddress ?? null),
        deliveryZone: data.deliveryZone !== undefined ? data.deliveryZone : (existingSettings?.deliveryZone ?? null),
        pickupLat: data.pickupLat !== undefined ? data.pickupLat : (existingSettings?.pickupLat ?? null),
        pickupLon: data.pickupLon !== undefined ? data.pickupLon : (existingSettings?.pickupLon ?? null),
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

  app.get("/api/my-store/usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const store = await storage.getStoreByOwner(userId);
      if (!store) return res.status(404).json({ message: "Магазин не найден" });
      const products = await storage.getProducts(store.id);
      const monthlyOrders = await storage.countOrdersThisMonth(store.id);
      const totalImages = await storage.countImages(store.id);
      const planLimits = await storage.getEffectivePlanLimits(store.plan);
      res.json({
        plan: store.plan,
        products: products.length,
        productLimit: planLimits.productLimit,
        monthlyOrders,
        orderLimit: planLimits.orderLimit,
        totalImages,
        imageLimit: planLimits.imageLimit,
      });
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

  app.get("/api/platform-pixels", async (_req, res) => {
    try {
      let pixelData: any = {};
      const raw = await storage.getPlatformSetting("tracking_pixels");
      if (raw) {
        pixelData = typeof raw === "string" ? JSON.parse(raw) : raw;
      }
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      res.json({
        facebookPixelId: pixelData.facebookPixelId || null,
        tiktokPixelId: pixelData.tiktokPixelId || null,
      });
    } catch {
      res.json({ facebookPixelId: null, tiktokPixelId: null });
    }
  });

  app.get("/api/tariffs", async (_req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      const plans = ["free", "business", "enterprise"];
      const result: Record<string, { price: number; limit: number; orderLimit: number; imageLimit: number; name: string; features: string[] }> = {};
      for (const plan of plans) {
        const saved = settings.find((s) => s.key === `plan_${plan}`);
        if (saved && saved.value) {
          const v = saved.value as any;
          result[plan] = {
            price: v.price ?? PLAN_PRICES[plan],
            limit: v.limit ?? PLAN_LIMITS[plan],
            orderLimit: v.orderLimit ?? PLAN_ORDER_LIMITS[plan],
            imageLimit: v.imageLimit ?? PLAN_IMAGE_LIMITS[plan],
            name: v.name ?? PLAN_NAMES[plan],
            features: v.features ?? PLAN_FEATURES[plan],
          };
        } else {
          result[plan] = {
            price: PLAN_PRICES[plan],
            limit: PLAN_LIMITS[plan],
            orderLimit: PLAN_ORDER_LIMITS[plan],
            imageLimit: PLAN_IMAGE_LIMITS[plan],
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

      const [theme, settings, cats, prods, platformPixels] = await Promise.all([
        storage.getTheme(store.id),
        storage.getSettings(store.id),
        storage.getCategories(store.id),
        storage.getProducts(store.id),
        storage.getPlatformSetting("tracking_pixels").catch(() => null),
      ]);

      await storage.recordEvent({ storeId: store.id, eventType: "visit" }).catch(() => {});

      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      res.json({
        store,
        theme: theme || { primaryColor: "#2563eb", secondaryColor: null, logoUrl: null, bannerUrl: null, bannerOverlay: true, buttonStyle: "pill", cardStyle: "bordered", fontStyle: "modern" },
        settings: settings || { showPrices: true, whatsappTemplate: "", instagramUrl: null, phoneNumber: null, checkoutAddressEnabled: false, checkoutCommentEnabled: false, facebookPixelId: null, tiktokPixelId: null, googleAnalyticsId: null, seoTitle: null, seoDescription: null, ogImageUrl: null, faviconUrl: null, isPublicListed: true, deliveryEnabled: false, pickupEnabled: true, deliveryFee: null, deliveryFreeThreshold: null, pickupAddress: null, deliveryZone: null, announcementText: null, showAnnouncement: false, telegramUrl: null, showSocialCards: true, showCategoryChips: true, categoryDisplayStyle: "chips" },
        platformPixels: platformPixels || { facebookPixelId: "", tiktokPixelId: "", googleAnalyticsId: "" },
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
      variantTitle: z.string().nullable().optional(),
    })).min(1),
    paymentMethod: z.string().max(30).nullable().optional(),
    deliveryMethod: z.enum(["pickup", "delivery"]).nullable().optional(),
    deliveryFee: z.number().int().min(0).optional().default(0),
    discountCode: z.string().optional(),
    discountId: z.number().optional(),
    discountAmount: z.number().optional(),
    discountTitle: z.string().optional(),
  });

  app.post("/api/storefront/:slug/order", async (req, res) => {
    try {
      const data = validate(orderSchema, req.body);
      const store = await storage.getStoreBySlug(req.params.slug);
      if (!store) return res.status(404).json({ message: "Not found" });

      const planLimits = await storage.getEffectivePlanLimits(store.plan);
      if (planLimits.orderLimit > 0) {
        const monthOrders = await storage.countOrdersThisMonth(store.id);
        if (monthOrders >= planLimits.orderLimit) {
          return res.status(403).json({ message: "К сожалению, магазин временно не принимает заказы. Попробуйте позже.", code: "ORDER_LIMIT_REACHED" });
        }
      }

      const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryFee = data.deliveryFee || 0;

      let discountAmount = 0;
      let discountTitle: string | null = null;
      let discountCode: string | null = null;

      if (data.discountCode) {
        const discount = await storage.getDiscountByCode(store.id, data.discountCode.toUpperCase());
        if (discount) {
          const now = new Date();
          const isValid = discount.isActive && 
            (!discount.startDate || now >= discount.startDate) && 
            (!discount.endDate || now <= discount.endDate) &&
            (!discount.maxTotalUses || discount.currentUses < discount.maxTotalUses);
          
          if (isValid) {
            if (discount.minRequirement === "amount" && discount.minValue && subtotal < discount.minValue) {
            } else if (discount.appliesTo === "products" && discount.targetProductIds) {
              const targetIds = discount.targetProductIds as number[];
              const eligibleSubtotal = data.items
                .filter((item: any) => targetIds.includes(item.productId))
                .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
              if (eligibleSubtotal > 0) {
                if (discount.valueType === "percentage") {
                  discountAmount = Math.round(eligibleSubtotal * discount.value / 100);
                } else if (discount.valueType === "fixed") {
                  discountAmount = Math.min(discount.value, eligibleSubtotal);
                }
                discountTitle = discount.title;
                discountCode = discount.code;
                await storage.incrementDiscountUses(discount.id);
              }
            } else {
              if (discount.valueType === "percentage") {
                discountAmount = Math.round(subtotal * discount.value / 100);
              } else if (discount.valueType === "fixed") {
                discountAmount = Math.min(discount.value, subtotal);
              }
              discountTitle = discount.title;
              discountCode = discount.code;
              await storage.incrementDiscountUses(discount.id);
            }
          }
        }
      } else if (data.discountId) {
        const discount = await storage.getDiscount(Number(data.discountId), store.id);
        if (discount && discount.isActive) {
          if (discount.type === "free_delivery") {
            discountAmount = deliveryFee;
            discountTitle = discount.title;
          } else {
            if (discount.valueType === "percentage") {
              discountAmount = Math.round(subtotal * discount.value / 100);
            } else if (discount.valueType === "fixed") {
              discountAmount = Math.min(discount.value, subtotal);
            }
            discountTitle = discount.title;
          }
          await storage.incrementDiscountUses(discount.id);
        }
      }

      const total = subtotal + deliveryFee - discountAmount;
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
        total,
        paymentMethod: data.paymentMethod || null,
        status: "pending",
        deliveryMethod: data.deliveryMethod || null,
        deliveryFee,
        discountTitle,
        discountAmount,
        discountCode,
      });

      await storage.upsertCustomerFromOrder(store.id, data.customerName, data.customerPhone, subtotal).catch((err) => {
        console.error("Failed to upsert customer from order:", err);
      });

      sendOrderNotification(store.name, store.whatsappPhone, orderNumber, data.customerName, total, store.id, data.deliveryMethod, deliveryFee, data.items).catch((err) => {
        console.error("Failed to send WhatsApp order notification:", err);
      });

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

  app.get("/api/orders/:slug/:orderNumber", async (req, res) => {
    try {
      const { slug, orderNumber } = req.params;
      const num = parseInt(orderNumber);
      if (isNaN(num)) return res.status(400).json({ message: "Invalid order number" });

      const store = await storage.getStoreBySlug(slug);
      if (!store) return res.status(404).json({ message: "Store not found" });

      const order = await storage.getOrderByStoreAndNumber(store.id, num);
      if (!order) return res.status(404).json({ message: "Order not found" });

      res.json({ order, storeName: store.name, storeSlug: store.slug });
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
      const storeOrders = await storage.getOrdersByStore(store.id);

      const customersWithStatus = customersList.map((c) => {
        const customerOrders = storeOrders.filter(
          (o) => o.customerPhone === c.phone
        );
        const confirmedOrders = customerOrders.filter(
          (o) => o.status === "confirmed" || o.status === "completed"
        ).length;
        const pendingOrders = customerOrders.filter(
          (o) => o.status === "pending"
        ).length;
        const cancelledOrders = customerOrders.filter(
          (o) => o.status === "cancelled"
        ).length;
        const earliestOrderAt = customerOrders.length > 0
          ? customerOrders.reduce((earliest, o) => {
              const t = new Date(o.createdAt!).getTime();
              return t < earliest ? t : earliest;
            }, Infinity)
          : null;
        return {
          ...c,
          confirmedOrders,
          pendingOrders,
          cancelledOrders,
          earliestOrderAt: earliestOrderAt ? new Date(earliestOrderAt).toISOString() : null,
        };
      });

      res.json(customersWithStatus);
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

  app.get("/api/my-store/discounts", isAuthenticated, async (req: any, res) => {
    try {
      const store = await storage.getStoreByOwner(req.session.userId);
      if (!store) return res.status(404).json({ error: "Магазин не найден" });
      const discounts = await storage.getDiscounts(store.id);
      res.json(discounts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/my-store/discounts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const store = await storage.getStoreByOwner(req.session.userId);
      if (!store) return res.status(404).json({ error: "Магазин не найден" });
      const discount = await storage.getDiscount(Number(req.params.id), store.id);
      if (!discount) return res.status(404).json({ error: "Скидка не найдена" });
      res.json(discount);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/my-store/discounts", isAuthenticated, async (req: any, res) => {
    try {
      const store = await storage.getStoreByOwner(req.session.userId);
      if (!store) return res.status(404).json({ error: "Магазин не найден" });
      
      const data = { ...req.body, storeId: store.id };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);
      if (data.type === "code" && data.code) {
        data.code = data.code.toUpperCase().trim();
        const existing = await storage.getDiscountByCode(store.id, data.code);
        if (existing) return res.status(400).json({ error: "Промокод уже существует" });
      }
      
      const discount = await storage.createDiscount(data);
      res.json(discount);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/my-store/discounts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const store = await storage.getStoreByOwner(req.session.userId);
      if (!store) return res.status(404).json({ error: "Магазин не найден" });
      const updateData = { ...req.body };
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
      else if (updateData.endDate === "") updateData.endDate = null;
      const discount = await storage.updateDiscount(Number(req.params.id), store.id, updateData);
      if (!discount) return res.status(404).json({ error: "Скидка не найдена" });
      res.json(discount);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/my-store/discounts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const store = await storage.getStoreByOwner(req.session.userId);
      if (!store) return res.status(404).json({ error: "Магазин не найден" });
      await storage.deleteDiscount(Number(req.params.id), store.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/storefront/:slug/discounts", async (req, res) => {
    try {
      const store = await storage.getStoreBySlug(req.params.slug);
      if (!store) return res.status(404).json({ error: "Магазин не найден" });
      const activeDiscounts = await storage.getActiveDiscounts(store.id);
      const now = new Date();
      const eligible = activeDiscounts
        .filter((d) => ["order_amount", "automatic", "free_delivery"].includes(d.type))
        .filter((d) => !d.startDate || now >= d.startDate)
        .filter((d) => !d.endDate || now <= d.endDate)
        .filter((d) => !d.maxTotalUses || d.currentUses < d.maxTotalUses)
        .map((d) => ({ id: d.id, title: d.title, type: d.type, valueType: d.valueType, value: d.value, appliesTo: d.appliesTo, minRequirement: d.minRequirement, minValue: d.minValue }));
      res.json(eligible);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/storefront/:slug/validate-discount", async (req, res) => {
    try {
      const store = await storage.getStoreBySlug(req.params.slug);
      if (!store) return res.status(404).json({ error: "Магазин не найден" });
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Код скидки не указан" });
      const discount = await storage.getDiscountByCode(store.id, code.toUpperCase());
      if (!discount) return res.status(404).json({ error: "Промокод не найден" });
      const now = new Date();
      if (discount.startDate && now < discount.startDate) return res.status(400).json({ error: "Промокод еще не активен" });
      if (discount.endDate && now > discount.endDate) return res.status(400).json({ error: "Промокод истек" });
      if (discount.maxTotalUses && discount.currentUses >= discount.maxTotalUses) return res.status(400).json({ error: "Промокод исчерпан" });
      res.json({ discount: { id: discount.id, title: discount.title, valueType: discount.valueType, value: discount.value, appliesTo: discount.appliesTo, targetProductIds: discount.targetProductIds, targetCategoryIds: discount.targetCategoryIds, minRequirement: discount.minRequirement, minValue: discount.minValue, type: discount.type } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
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
        plan: z.enum(["free", "business", "enterprise"]),
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
      if (!["free", "business", "enterprise"].includes(planKey)) {
        return res.status(400).json({ message: "Неизвестный тариф" });
      }
      const schema = z.object({
        price: z.number().min(0),
        limit: z.number().min(1),
        orderLimit: z.number().optional(),
        imageLimit: z.number().optional(),
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

  app.get("/api/superadmin/waba/config", isSuperAdminMiddleware, async (_req, res) => {
    try {
      const config = await getWabaConfigRaw();
      const safeConfig = { ...config, apiKey: config.apiKey ? "***" + (config.apiKey as string).slice(-4) : "" };
      res.json(safeConfig);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/superadmin/waba/config", isSuperAdminMiddleware, async (req, res) => {
    try {
      const schema = z.object({
        apiKey: z.string().optional(),
        senderPhone: z.string().optional(),
        orderNotificationTemplate: z.string().optional(),
        broadcastTemplate: z.string().optional(),
        enabled: z.boolean().optional(),
      });
      const data = validate(schema, req.body);
      const currentConfig = await getWabaConfigRaw();
      if (data.apiKey === undefined || data.apiKey === "" || data.apiKey?.startsWith("***")) {
        data.apiKey = (currentConfig as any).apiKey;
      }
      await saveWabaConfig(data);
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/waba/messages", isSuperAdminMiddleware, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
      const messages = await getMessageLog(limit, storeId);
      const stats = await getMessageStats();
      res.json({ messages, stats });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/superadmin/waba/broadcast", isSuperAdminMiddleware, async (req, res) => {
    try {
      const schema = z.object({
        storeId: z.number().optional(),
        message: z.string().min(1).max(4096),
        targetType: z.enum(["all_customers", "store_customers"]),
      });
      const data = validate(schema, req.body);

      let customers: { phone: string | null; name: string; storeId: number }[] = [];
      if (data.targetType === "store_customers" && data.storeId) {
        const storeCustomers = await storage.getCustomersByStore(data.storeId);
        customers = storeCustomers.filter((c) => c.phone && c.isActive).map((c) => ({ phone: c.phone, name: c.name, storeId: c.storeId }));
      } else {
        const allStores = await storage.getAllStores();
        for (const store of allStores) {
          const sc = await storage.getCustomersByStore(store.id);
          customers.push(...sc.filter((c) => c.phone && c.isActive).map((c) => ({ phone: c.phone, name: c.name, storeId: c.storeId })));
        }
      }

      const uniquePhones = new Map<string, { phone: string; name: string; storeId: number }>();
      for (const c of customers) {
        if (c.phone) {
          const cleaned = c.phone.replace(/[^0-9]/g, "");
          if (cleaned && !uniquePhones.has(cleaned)) {
            uniquePhones.set(cleaned, { phone: cleaned, name: c.name, storeId: c.storeId });
          }
        }
      }

      const results: { phone: string; status: string; error?: string }[] = [];
      for (const [phone, cust] of uniquePhones) {
        try {
          const msg = await sendTextMessage(phone, data.message, cust.storeId);
          results.push({ phone, status: msg.status, error: msg.errorMessage || undefined });
        } catch (err: any) {
          results.push({ phone, status: "failed", error: err.message });
        }
      }

      const sent = results.filter((r) => r.status === "sent").length;
      const failed = results.filter((r) => r.status === "failed").length;
      res.json({ total: results.length, sent, failed, results });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/superadmin/waba/test", isSuperAdminMiddleware, async (req, res) => {
    try {
      const schema = z.object({ phone: z.string().min(5), message: z.string().min(1) });
      const data = validate(schema, req.body);
      const msg = await sendTextMessage(data.phone, data.message);
      res.json(msg);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/waba/onboarding", isSuperAdminMiddleware, async (_req, res) => {
    try {
      const config = await getOnboardingConfig();
      res.json(config);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/superadmin/waba/onboarding", isSuperAdminMiddleware, async (req, res) => {
    try {
      const schema = z.object({
        welcomeEnabled: z.boolean().optional(),
        welcomeMessage: z.string().max(4096).optional(),
        storeCreatedEnabled: z.boolean().optional(),
        storeCreatedMessage: z.string().max(4096).optional(),
        tipsEnabled: z.boolean().optional(),
        tipsMessages: z.array(z.string().max(4096)).max(10).optional(),
        tipsDelayMinutes: z.number().int().min(1).max(10080).optional(),
      });
      const data = validate(schema, req.body);
      await saveOnboardingConfig(data);
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/tracking-pixels", isSuperAdminMiddleware, async (_req, res) => {
    try {
      const pixels = await storage.getPlatformSetting("tracking_pixels");
      res.json(pixels || { facebookPixelId: "", tiktokPixelId: "", googleAnalyticsId: "" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/superadmin/tracking-pixels", isSuperAdminMiddleware, async (req, res) => {
    try {
      const schema = z.object({
        facebookPixelId: z.string().max(50).regex(/^[0-9]*$/).optional(),
        tiktokPixelId: z.string().max(50).regex(/^[A-Za-z0-9_]*$/).optional(),
        googleAnalyticsId: z.string().max(30).regex(/^(G-[A-Za-z0-9]+|UA-[0-9]+-[0-9]+)?$/).optional(),
      });
      const data = validate(schema, req.body);
      await storage.setPlatformSetting("tracking_pixels", data);
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/superadmin/email/broadcasts", isSuperAdminMiddleware, async (_req, res) => {
    try {
      const broadcasts = await db.select().from(emailBroadcasts).orderBy(desc(emailBroadcasts.createdAt)).limit(50);
      res.json(broadcasts);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/superadmin/email/broadcast", isSuperAdminMiddleware, async (req, res) => {
    try {
      const schema = z.object({
        subject: z.string().min(1).max(500),
        htmlContent: z.string().min(1).max(50000),
      });
      const data = validate(schema, req.body);

      const allUsers = await db.select({ email: users.email }).from(users);
      const validEmails = allUsers.map(u => u.email).filter((e): e is string => !!e && e.includes("@"));

      if (validEmails.length === 0) {
        return res.status(400).json({ message: "Нет пользователей с email" });
      }

      const [broadcast] = await db.insert(emailBroadcasts).values({
        subject: data.subject,
        htmlContent: data.htmlContent,
        recipientCount: validEmails.length,
        status: "sending",
        sentBy: (req as any).user?.id || null,
      }).returning();

      res.json({ id: broadcast.id, recipientCount: validEmails.length, status: "sending" });

      sendBroadcastEmail(validEmails, data.subject, data.htmlContent).then(async ({ success, fail }) => {
        await db.update(emailBroadcasts).set({
          successCount: success,
          failCount: fail,
          status: "completed",
        }).where(eq(emailBroadcasts.id, broadcast.id));
      }).catch(async (err) => {
        console.error("Broadcast email error:", err);
        await db.update(emailBroadcasts).set({ status: "failed" }).where(eq(emailBroadcasts.id, broadcast.id));
      });

    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Некорректные данные", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
