import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { isStoreSlug, getStoreSeoMeta, injectSeoMeta, getBaseUrl } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use("/{*path}", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const slug = isStoreSlug(req.path);
    if (slug) {
      try {
        const baseUrl = getBaseUrl(req);
        const metaTags = await getStoreSeoMeta(slug, baseUrl);
        if (metaTags) {
          let html = await fs.promises.readFile(indexPath, "utf-8");
          html = injectSeoMeta(html, metaTags);
          return res.status(200).set({ "Content-Type": "text/html" }).end(html);
        }
      } catch {}
    }
    res.sendFile(indexPath);
  });
}
