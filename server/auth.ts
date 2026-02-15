import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, passwordResetCodes } from "@shared/models/auth";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";
import { sendOnboardingWelcome } from "./whatsapp";
import { sendPasswordResetEmail } from "./email";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function setupSession(app: Express) {
  app.set("trust proxy", 1);
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sessionTtl,
      },
    })
  );
}

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email));
      if (existing) {
        return res
          .status(400)
          .json({ message: "Этот email уже зарегистрирован" });
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const phone = data.phone ? data.phone.replace(/[^0-9]/g, "") : null;
      const [user] = await db
        .insert(users)
        .values({
          email: data.email,
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          phone,
        })
        .returning();

      if (phone) {
        sendOnboardingWelcome(phone, user.firstName || "").catch((err) => {
          console.error("Onboarding welcome error:", err);
        });
      }

      req.session.userId = user.id;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Некорректные данные", errors: e.errors });
      }
      console.error("Register error:", e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email));
      if (!user || !user.passwordHash) {
        return res
          .status(401)
          .json({ message: "Неверный email или пароль" });
      }

      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) {
        return res
          .status(401)
          .json({ message: "Неверный email или пароль" });
      }

      req.session.userId = user.id;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Некорректные данные", errors: e.errors });
      }
      console.error("Login error:", e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода" });
      }
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });

  const forgotPasswordSchema = z.object({
    email: z.string().email().max(255),
  });

  const forgotAttempts = new Map<string, { count: number; resetAt: number }>();

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const lowerEmail = email.toLowerCase().trim();

      const now = Date.now();
      const attempt = forgotAttempts.get(lowerEmail);
      if (attempt && attempt.resetAt > now && attempt.count >= 5) {
        return res.status(429).json({ message: "Слишком много попыток. Попробуйте через 15 минут." });
      }
      if (!attempt || attempt.resetAt <= now) {
        forgotAttempts.set(lowerEmail, { count: 1, resetAt: now + 15 * 60 * 1000 });
      } else {
        attempt.count++;
      }

      const maskedEmail = lowerEmail.slice(0, 2) + "***@" + lowerEmail.split("@")[1];

      const [user] = await db.select().from(users).where(eq(users.email, lowerEmail));
      if (!user) {
        return res.json({ ok: true, email: maskedEmail });
      }

      await db.update(passwordResetCodes)
        .set({ used: true })
        .where(and(eq(passwordResetCodes.email, lowerEmail), eq(passwordResetCodes.used, false)));

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.insert(passwordResetCodes).values({
        email: lowerEmail,
        code,
        userId: user.id,
        expiresAt,
      });

      try {
        await sendPasswordResetEmail(lowerEmail, code);
      } catch (err) {
        console.error("Failed to send reset code via email:", err);
      }

      res.json({ ok: true, email: maskedEmail });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Введите корректный email" });
      }
      console.error("Forgot password error:", e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  const verifyCodeSchema = z.object({
    email: z.string().email().max(255),
    code: z.string().length(6),
  });

  const verifyAttempts = new Map<string, { count: number; resetAt: number }>();

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, code } = verifyCodeSchema.parse(req.body);
      const lowerEmail = email.toLowerCase().trim();

      const now = Date.now();
      const attempt = verifyAttempts.get(lowerEmail);
      if (attempt && attempt.resetAt > now && attempt.count >= 10) {
        return res.status(429).json({ message: "Слишком много попыток. Попробуйте позже." });
      }
      if (!attempt || attempt.resetAt <= now) {
        verifyAttempts.set(lowerEmail, { count: 1, resetAt: now + 15 * 60 * 1000 });
      } else {
        attempt.count++;
      }

      const [record] = await db.select()
        .from(passwordResetCodes)
        .where(and(
          eq(passwordResetCodes.email, lowerEmail),
          eq(passwordResetCodes.code, code),
          eq(passwordResetCodes.used, false),
          gt(passwordResetCodes.expiresAt, new Date()),
        ));

      if (!record) {
        return res.status(400).json({ message: "Неверный или просроченный код" });
      }

      await db.update(passwordResetCodes).set({ used: true }).where(eq(passwordResetCodes.id, record.id));

      res.json({ ok: true, resetToken: record.id });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные" });
      }
      console.error("Verify code error:", e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  const resetPasswordSchema = z.object({
    resetToken: z.string().min(1),
    password: z.string().min(6).max(128),
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { resetToken, password } = resetPasswordSchema.parse(req.body);

      const [record] = await db.select()
        .from(passwordResetCodes)
        .where(and(
          eq(passwordResetCodes.id, resetToken),
          gt(passwordResetCodes.expiresAt, new Date()),
        ));

      if (!record) {
        return res.status(400).json({ message: "Ссылка восстановления недействительна" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
      await db.delete(passwordResetCodes).where(eq(passwordResetCodes.id, record.id));

      req.session.userId = record.userId;
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Некорректные данные" });
      }
      console.error("Reset password error:", e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId));
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export const isSuperAdminMiddleware: RequestHandler = async (req: any, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
  if (!user || !user.isSuperAdmin) {
    return res.status(403).json({ message: "Доступ запрещён" });
  }
  next();
};

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function ensureSuperAdmin() {
  const email = "batyrkhan.aff@gmail.com";
  const password = "Expo2017!";
  const passwordHash = await bcrypt.hash(password, 10);

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    await db.update(users).set({ passwordHash, isSuperAdmin: true }).where(eq(users.id, existing.id));
    console.log(`SuperAdmin updated: ${email}`);
  } else {
    await db.insert(users).values({
      email,
      passwordHash,
      firstName: "BATYRKHAN",
      isSuperAdmin: true,
    });
    console.log(`SuperAdmin created: ${email}`);
  }

}
