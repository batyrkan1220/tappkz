import { db } from "./db";
import { whatsappMessages, platformSettings, scheduledMessages } from "@shared/schema";
import { eq, desc, count, and, lte } from "drizzle-orm";
import type { InsertWhatsappMessage, WhatsappMessage } from "@shared/schema";

const WABA_API_URL = "https://waba-v2.360dialog.io";

interface WabaConfig {
  apiKey: string;
  senderPhone: string;
  orderNotificationTemplate: string;
  broadcastTemplate: string;
  enabled: boolean;
}

export async function getWabaConfig(): Promise<WabaConfig | null> {
  const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, "waba_config"));
  if (!setting?.value) return null;
  const v = setting.value as any;
  if (!v.apiKey || !v.enabled) return null;
  return {
    apiKey: v.apiKey || "",
    senderPhone: v.senderPhone || "",
    orderNotificationTemplate: v.orderNotificationTemplate || "order_notification",
    broadcastTemplate: v.broadcastTemplate || "broadcast_message",
    enabled: v.enabled ?? false,
  };
}

export async function getWabaConfigRaw(): Promise<Partial<WabaConfig>> {
  const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, "waba_config"));
  if (!setting?.value) return { enabled: false };
  return setting.value as any;
}

export async function saveWabaConfig(config: Partial<WabaConfig>): Promise<void> {
  const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, "waba_config"));
  if (existing.length > 0) {
    await db.update(platformSettings)
      .set({ value: { ...existing[0].value as any, ...config }, updatedAt: new Date() })
      .where(eq(platformSettings.key, "waba_config"));
  } else {
    await db.insert(platformSettings).values({ key: "waba_config", value: config as any });
  }
}

async function sendWabaRequest(apiKey: string, payload: any): Promise<{ success: boolean; wamid?: string; error?: string }> {
  try {
    const res = await fetch(`${WABA_API_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id) {
      return { success: true, wamid: data.messages[0].id };
    }
    return { success: false, error: JSON.stringify(data) };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

function formatPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export async function sendTextMessage(recipientPhone: string, text: string, storeId?: number): Promise<WhatsappMessage> {
  const config = await getWabaConfig();
  const phone = formatPhone(recipientPhone);

  const logEntry: InsertWhatsappMessage = {
    storeId: storeId ?? null,
    recipientPhone: phone,
    messageType: "text",
    content: text,
    status: "pending",
  };

  if (!config) {
    logEntry.status = "failed";
    logEntry.errorMessage = "WABA not configured";
    const [msg] = await db.insert(whatsappMessages).values(logEntry).returning();
    return msg;
  }

  const result = await sendWabaRequest(config.apiKey, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "text",
    text: { body: text },
  });

  logEntry.status = result.success ? "sent" : "failed";
  logEntry.wamid = result.wamid || null;
  logEntry.errorMessage = result.error || null;

  const [msg] = await db.insert(whatsappMessages).values(logEntry).returning();
  return msg;
}

export async function sendTemplateMessage(
  recipientPhone: string,
  templateName: string,
  languageCode: string,
  parameters: string[],
  storeId?: number
): Promise<WhatsappMessage> {
  const config = await getWabaConfig();
  const phone = formatPhone(recipientPhone);

  const logEntry: InsertWhatsappMessage = {
    storeId: storeId ?? null,
    recipientPhone: phone,
    messageType: "template",
    templateName,
    content: parameters.join(", "),
    status: "pending",
  };

  if (!config) {
    logEntry.status = "failed";
    logEntry.errorMessage = "WABA not configured";
    const [msg] = await db.insert(whatsappMessages).values(logEntry).returning();
    return msg;
  }

  const components: any[] = [];
  if (parameters.length > 0) {
    components.push({
      type: "body",
      parameters: parameters.map((p) => ({ type: "text", text: p })),
    });
  }

  const result = await sendWabaRequest(config.apiKey, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });

  logEntry.status = result.success ? "sent" : "failed";
  logEntry.wamid = result.wamid || null;
  logEntry.errorMessage = result.error || null;

  const [msg] = await db.insert(whatsappMessages).values(logEntry).returning();
  return msg;
}

export async function sendOrderNotification(
  storeName: string,
  storePhone: string,
  orderNumber: number,
  customerName: string,
  total: number,
  storeId: number
): Promise<WhatsappMessage> {
  const config = await getWabaConfig();
  if (!config) {
    const [msg] = await db.insert(whatsappMessages).values({
      storeId,
      recipientPhone: formatPhone(storePhone),
      messageType: "order_notification",
      content: `Заказ #${orderNumber}`,
      status: "failed",
      errorMessage: "WABA not configured",
    }).returning();
    return msg;
  }

  const totalFormatted = new Intl.NumberFormat("ru-RU").format(total) + " ₸";
  const text = `*Новый заказ #${orderNumber}*\n\nПокупатель: ${customerName}\nСумма: ${totalFormatted}\n\nОткройте панель управления для подробностей.`;

  return sendTextMessage(storePhone, text, storeId);
}

interface OnboardingConfig {
  welcomeEnabled: boolean;
  welcomeMessage: string;
  storeCreatedEnabled: boolean;
  storeCreatedMessage: string;
  tipsEnabled: boolean;
  tipsMessages: string[];
  tipsDelayMinutes: number;
}

const DEFAULT_ONBOARDING: OnboardingConfig = {
  welcomeEnabled: true,
  welcomeMessage: `Добро пожаловать в TakeSale! 🎉

Вы сделали первый шаг к онлайн-продажам через WhatsApp.

Что вас ждёт:
✅ Создайте магазин за 5 минут
✅ Добавьте товары с фото и ценами
✅ Поделитесь ссылкой — клиенты заказывают через WhatsApp

Нужна помощь? Мы всегда на связи!`,
  storeCreatedEnabled: true,
  storeCreatedMessage: `Отлично! Ваш магазин "{store_name}" создан! 🏪

Ваша витрина: takesale.replit.app/s/{slug}

Следующие шаги:
1️⃣ Создайте категории товаров
2️⃣ Добавьте товары с фото и ценами
3️⃣ Настройте брендинг (логотип, цвета)
4️⃣ Отправьте ссылку клиентам!

Советы для быстрого старта:
• Добавьте минимум 5 товаров
• Загрузите качественные фото
• Укажите актуальные цены`,
  tipsEnabled: true,
  tipsMessages: [
    `💡 Совет #1: Качественные фото

Хорошие фото товаров увеличивают продажи в 3 раза!

Рекомендации:
• Снимайте при дневном свете
• Используйте однотонный фон
• Покажите товар с разных сторон
• Минимум 2-3 фото на товар`,
    `💡 Совет #2: Описания товаров

Подробное описание — ключ к продажам:
• Укажите размеры и материал
• Опишите преимущества
• Добавьте информацию о доставке
• Используйте простой язык`,
    `💡 Совет #3: Продвижение магазина

Как привлечь первых клиентов:
• Разместите ссылку в Instagram Bio
• Отправьте друзьям и знакомым
• Добавьте в WhatsApp статус
• Расскажите в соцсетях`,
  ],
  tipsDelayMinutes: 60,
};

export async function getOnboardingConfig(): Promise<OnboardingConfig> {
  const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, "onboarding_messages"));
  if (!setting?.value) return DEFAULT_ONBOARDING;
  return { ...DEFAULT_ONBOARDING, ...(setting.value as any) };
}

export async function saveOnboardingConfig(config: Partial<OnboardingConfig>): Promise<void> {
  const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, "onboarding_messages"));
  if (existing.length > 0) {
    await db.update(platformSettings)
      .set({ value: { ...existing[0].value as any, ...config }, updatedAt: new Date() })
      .where(eq(platformSettings.key, "onboarding_messages"));
  } else {
    await db.insert(platformSettings).values({ key: "onboarding_messages", value: config as any });
  }
}

export async function sendOnboardingWelcome(phone: string, firstName: string): Promise<void> {
  const config = await getOnboardingConfig();
  if (!config.welcomeEnabled || !config.welcomeMessage) return;

  let msg = config.welcomeMessage;
  if (firstName) {
    msg = msg.replace("{name}", firstName);
  } else {
    msg = msg.replace("{name}", "").replace("  ", " ");
  }

  await sendTextMessage(phone, msg);

  if (config.tipsEnabled && config.tipsMessages.length > 0) {
    const delayMinutes = config.tipsDelayMinutes || 60;
    const now = new Date();
    const validTips = config.tipsMessages.filter((tip) => tip && tip.trim().length > 0);
    if (validTips.length > 0) {
      const rows = validTips.map((tip, i) => ({
        recipientPhone: formatPhone(phone),
        content: tip,
        scheduledAt: new Date(now.getTime() + delayMinutes * 60 * 1000 * (i + 1)),
        sent: false,
      }));
      await db.insert(scheduledMessages).values(rows);
    }
  }
}

export async function sendOnboardingStoreCreated(phone: string, storeName: string, slug: string): Promise<void> {
  const config = await getOnboardingConfig();
  if (!config.storeCreatedEnabled || !config.storeCreatedMessage) return;

  let msg = config.storeCreatedMessage
    .replace("{store_name}", storeName)
    .replace("{slug}", slug);

  await sendTextMessage(phone, msg);
}

export async function getMessageLog(limit: number = 50, storeId?: number): Promise<WhatsappMessage[]> {
  if (storeId) {
    return db.select().from(whatsappMessages).where(eq(whatsappMessages.storeId, storeId)).orderBy(desc(whatsappMessages.createdAt)).limit(limit);
  }
  return db.select().from(whatsappMessages).orderBy(desc(whatsappMessages.createdAt)).limit(limit);
}

export async function getMessageStats(): Promise<{ total: number; sent: number; failed: number }> {
  const all = await db.select({ count: count() }).from(whatsappMessages);
  const sent = await db.select({ count: count() }).from(whatsappMessages).where(eq(whatsappMessages.status, "sent"));
  const failed = await db.select({ count: count() }).from(whatsappMessages).where(eq(whatsappMessages.status, "failed"));
  return {
    total: all[0]?.count ?? 0,
    sent: sent[0]?.count ?? 0,
    failed: failed[0]?.count ?? 0,
  };
}

async function processScheduledMessages(): Promise<void> {
  try {
    const now = new Date();
    const pending = await db.select()
      .from(scheduledMessages)
      .where(and(eq(scheduledMessages.sent, false), lte(scheduledMessages.scheduledAt, now)))
      .limit(10);

    for (const msg of pending) {
      try {
        const result = await sendTextMessage(msg.recipientPhone, msg.content);
        if (result.status === "sent") {
          await db.delete(scheduledMessages).where(eq(scheduledMessages.id, msg.id));
        } else {
          console.error(`Scheduled message #${msg.id} failed, will retry`);
        }
      } catch (err) {
        console.error(`Scheduled message #${msg.id} error:`, err);
      }
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await db.delete(scheduledMessages)
      .where(and(eq(scheduledMessages.sent, false), lte(scheduledMessages.scheduledAt, sevenDaysAgo)));
  } catch (err) {
    console.error("processScheduledMessages error:", err);
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduledMessagesWorker(): void {
  if (schedulerInterval) return;
  schedulerInterval = setInterval(processScheduledMessages, 60_000);
  console.log("Scheduled messages worker started (60s interval)");
}
