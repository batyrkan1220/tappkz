import { db } from "./db";
import { stores, storeThemes, storeSettings, categories, products, storeEvents } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  return;

  const [demoStore] = await db.insert(stores).values({
    ownerUserId: "demo-user",
    name: "Arai Beauty",
    slug: "arai-beauty",
    whatsappPhone: "77071234567",
    city: "Алматы",
    description: "Натуральная косметика и уход за кожей из Казахстана",
    plan: "free",
    isActive: true,
  }).returning();

  await db.insert(storeThemes).values({
    storeId: demoStore.id,
    primaryColor: "#be185d",
    logoUrl: null,
    bannerUrl: null,
  });

  await db.insert(storeSettings).values({
    storeId: demoStore.id,
    showPrices: true,
    currency: "KZT",
    whatsappTemplate: "Новый заказ из {store_name}!\n\nКлиент: {customer_name}\nТелефон: {customer_phone}\nАдрес: {address}\nКомментарий: {comment}\n\nТовары:\n{items}\n\nИтого: {total} ₸",
    instagramUrl: "@araibeauty",
    phoneNumber: "+7 707 123 45 67",
  });

  const [catFace] = await db.insert(categories).values({ storeId: demoStore.id, name: "Уход за лицом", sortOrder: 0, isActive: true }).returning();
  const [catBody] = await db.insert(categories).values({ storeId: demoStore.id, name: "Уход за телом", sortOrder: 1, isActive: true }).returning();
  const [catHair] = await db.insert(categories).values({ storeId: demoStore.id, name: "Волосы", sortOrder: 2, isActive: true }).returning();
  const [catSets] = await db.insert(categories).values({ storeId: demoStore.id, name: "Наборы", sortOrder: 3, isActive: true }).returning();

  await db.insert(products).values([
    {
      storeId: demoStore.id,
      categoryId: catFace.id,
      name: "Крем для лица увлажняющий",
      description: "Легкий дневной крем с гиалуроновой кислотой. Подходит для всех типов кожи. Объем 50 мл.",
      price: 4500,
      discountPrice: 3800,
      isActive: true,
      sortOrder: 0,
      imageUrls: [],
    },
    {
      storeId: demoStore.id,
      categoryId: catFace.id,
      name: "Сыворотка с витамином C",
      description: "Антиоксидантная сыворотка для сияния кожи. Осветляет пигментацию. 30 мл.",
      price: 6200,
      isActive: true,
      sortOrder: 1,
      imageUrls: [],
    },
    {
      storeId: demoStore.id,
      categoryId: catFace.id,
      name: "Тоник с экстрактом розы",
      description: "Нежный тоник для ежедневного очищения. Без спирта. 150 мл.",
      price: 2800,
      isActive: true,
      sortOrder: 2,
      imageUrls: [],
    },
    {
      storeId: demoStore.id,
      categoryId: catBody.id,
      name: "Масло для тела аргановое",
      description: "100% натуральное аргановое масло. Питает и увлажняет кожу. 100 мл.",
      price: 5500,
      discountPrice: 4900,
      isActive: true,
      sortOrder: 0,
      imageUrls: [],
    },
    {
      storeId: demoStore.id,
      categoryId: catBody.id,
      name: "Скраб для тела кофейный",
      description: "Натуральный скраб с кофе и кокосовым маслом. Антицеллюлитный эффект. 200 гр.",
      price: 3200,
      isActive: true,
      sortOrder: 1,
      imageUrls: [],
    },
    {
      storeId: demoStore.id,
      categoryId: catHair.id,
      name: "Шампунь безсульфатный",
      description: "Мягкий шампунь для всех типов волос. Не содержит SLS/SLES. 300 мл.",
      price: 3900,
      isActive: true,
      sortOrder: 0,
      imageUrls: [],
    },
    {
      storeId: demoStore.id,
      categoryId: catHair.id,
      name: "Маска для волос восстанавливающая",
      description: "Интенсивный уход для поврежденных волос. С кератином и маслом жожоба. 250 мл.",
      price: 4200,
      discountPrice: 3500,
      isActive: true,
      sortOrder: 1,
      imageUrls: [],
    },
    {
      storeId: demoStore.id,
      categoryId: catSets.id,
      name: "Набор «Сияние кожи»",
      description: "Крем + сыворотка + тоник в подарочной упаковке. Идеальный подарок!",
      price: 12000,
      discountPrice: 9900,
      isActive: true,
      sortOrder: 0,
      imageUrls: [],
    },
  ]);

  console.log("Demo store seeded: /s/arai-beauty");
}
