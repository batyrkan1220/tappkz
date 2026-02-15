import { useEffect } from "react";

const BASE_TITLE = "Tapp";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
    } else {
      document.title = `${BASE_TITLE} — Создайте интернет-магазин с заказом через WhatsApp`;
    }
    return () => {
      document.title = `${BASE_TITLE} — Создайте интернет-магазин с заказом через WhatsApp`;
    };
  }, [title]);
}

export function useStorefrontTitle(storeName?: string, city?: string) {
  useEffect(() => {
    if (storeName) {
      const loc = city ? ` в ${city}` : "";
      document.title = `${storeName}${loc} — Каталог и заказы через WhatsApp`;
    }
    return () => {
      document.title = `${BASE_TITLE} — Создайте интернет-магазин с заказом через WhatsApp`;
    };
  }, [storeName, city]);
}
