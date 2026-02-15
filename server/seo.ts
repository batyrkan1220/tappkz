import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeJsonLd(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/</g, "\\u003c");
}

function sanitizeUrl(url: string): string {
  return url.replace(/['"<>]/g, "");
}

function buildStoreJsonLd(store: any, theme: any, products: any[], baseUrl: string): string {
  const safeSlug = encodeURIComponent(store.slug);
  const storeUrl = `${sanitizeUrl(baseUrl)}/${safeSlug}`;
  const imageUrl = theme?.logoUrl ? `${sanitizeUrl(baseUrl)}${sanitizeUrl(theme.logoUrl)}` : null;

  const ld: any = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": store.name,
    "url": storeUrl,
    ...(store.description && { "description": store.description }),
    ...(imageUrl && { "image": imageUrl, "logo": imageUrl }),
    ...(store.city && { "address": { "@type": "PostalAddress", "addressLocality": store.city } }),
    ...(store.whatsappPhone && { "telephone": `+${store.whatsappPhone}` }),
    "brand": { "@type": "Brand", "name": store.name },
    "isPartOf": {
      "@type": "WebApplication",
      "name": "Tapp",
      "url": sanitizeUrl(baseUrl),
    },
  };

  if (products.length > 0) {
    const priceRange = products.reduce(
      (acc: any, p: any) => {
        const price = parseFloat(p.price);
        if (!isNaN(price) && price > 0) {
          acc.min = Math.min(acc.min, price);
          acc.max = Math.max(acc.max, price);
        }
        return acc;
      },
      { min: Infinity, max: 0 }
    );

    if (priceRange.min !== Infinity) {
      ld.priceRange = `${Math.round(priceRange.min)} - ${Math.round(priceRange.max)} ₸`;
    }

    ld.hasOfferCatalog = {
      "@type": "OfferCatalog",
      "name": `${store.name} — каталог`,
      "numberOfItems": products.length,
    };
  }

  return JSON.stringify(ld);
}

function buildStoreMeta(store: any, theme: any, products: any[], baseUrl: string): string {
  const storeName = escapeHtml(store.name);
  const city = store.city ? ` в ${escapeHtml(store.city)}` : "";
  const activeCount = products.length;
  const desc = store.description
    ? escapeHtml(store.description)
    : `${storeName}${city} — каталог товаров и услуг. Заказ через WhatsApp. ${activeCount} позиций в каталоге.`;
  const title = `${storeName}${city} — Каталог и заказы через WhatsApp`;
  const safeSlug = encodeURIComponent(store.slug);
  const storeUrl = `${sanitizeUrl(baseUrl)}/${safeSlug}`;
  const rawImageUrl = theme?.logoUrl || theme?.bannerUrl || null;
  const imageUrl = rawImageUrl ? `${sanitizeUrl(baseUrl)}${sanitizeUrl(rawImageUrl)}` : null;

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${storeUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${storeUrl}" />`,
    `<meta property="og:site_name" content="Tapp" />`,
    `<meta property="og:locale" content="ru_RU" />`,
  ];

  if (imageUrl) {
    tags.push(`<meta property="og:image" content="${imageUrl}" />`);
    tags.push(`<meta name="twitter:image" content="${imageUrl}" />`);
  }

  tags.push(`<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}" />`);
  tags.push(`<meta name="twitter:title" content="${title}" />`);
  tags.push(`<meta name="twitter:description" content="${desc}" />`);

  if (theme?.primaryColor) {
    tags.push(`<meta name="theme-color" content="${escapeHtml(theme.primaryColor)}" />`);
  }

  const jsonLd = buildStoreJsonLd(store, theme, products, baseUrl);
  tags.push(`<script type="application/ld+json">${jsonLd}</script>`);

  return tags.join("\n    ");
}

const RESERVED_PATHS = new Set([
  "api", "admin", "superadmin", "login", "register", "forgot-password",
  "invoice", "uploads", "assets", "src", "favicon.png", "robots.txt", "sitemap.xml",
  "vite-hmr", "__vite_ping", "node_modules",
]);

function isStoreSlug(pathname: string): string | null {
  const clean = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!clean || clean.includes("/")) return null;
  if (RESERVED_PATHS.has(clean)) return null;
  if (clean.startsWith(".") || clean.startsWith("@")) return null;
  return clean;
}

export function injectSeoMeta(html: string, metaTags: string): string {
  if (html.includes("<!--seo-meta-->")) {
    let result = html.replace("<!--seo-meta-->", metaTags);
    const titleMatch = metaTags.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      result = result.replace(/<title>[^<]*<\/title>/, `<title>${titleMatch[1]}</title>`);
    }
    return result;
  }
  return html.replace("</head>", `    ${metaTags}\n  </head>`);
}

export async function getStoreSeoMeta(slug: string, baseUrl: string): Promise<string | null> {
  try {
    const store = await storage.getStoreBySlug(slug);
    if (!store || !store.isActive) return null;

    const [theme, products] = await Promise.all([
      storage.getTheme(store.id),
      storage.getProducts(store.id),
    ]);

    const activeProducts = products.filter((p: any) => p.isActive);
    return buildStoreMeta(store, theme, activeProducts, baseUrl);
  } catch {
    return null;
  }
}

export function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "tapp.kz";
  return `${proto}://${host}`;
}

export { isStoreSlug };
