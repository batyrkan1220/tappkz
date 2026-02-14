import { db } from "./db";
import { stores, storeThemes, storeSettings, categories, products, storeEvents, orders, customers } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const [demoStore] = await db.select().from(stores).where(eq(stores.slug, "arai-beauty"));
  if (demoStore) {
    const sid = demoStore.id;
    await db.delete(storeEvents).where(eq(storeEvents.storeId, sid));
    await db.delete(orders).where(eq(orders.storeId, sid));
    await db.delete(customers).where(eq(customers.storeId, sid));
    await db.delete(products).where(eq(products.storeId, sid));
    await db.delete(categories).where(eq(categories.storeId, sid));
    await db.delete(storeThemes).where(eq(storeThemes.storeId, sid));
    await db.delete(storeSettings).where(eq(storeSettings.storeId, sid));
    await db.delete(stores).where(eq(stores.id, sid));
    console.log("Demo store arai-beauty removed");
  }
}
