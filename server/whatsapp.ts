import { db } from "./db";
import { whatsappMessages, platformSettings } from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";
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
